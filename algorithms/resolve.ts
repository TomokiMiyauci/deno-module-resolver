import { type Context } from "./context.ts";
import {
  info,
  MediaType,
  ModuleEntry,
  SourceFileInfo,
} from "../modules/deno/info.ts";
import { moduleResolve } from "./module_resolve.ts";
import { esmFileFormat } from "../deps.ts";

interface ResolveResult {
  url: URL;
  source?: SourceFileInfo;
  module?: ModuleEntry;
  mediaType: MediaType;
}

export async function resolve(
  specifier: string,
  referrerURL: URL | string,
  ctx: Context,
): Promise<ResolveResult> {
  // 1. Let resolved be undefined.
  let resolved: URL;

  let module: ModuleEntry | undefined = ctx.module;
  let source: SourceFileInfo | undefined = ctx.source;
  let mediaType: MediaType | undefined;

  if (URL.canParse(specifier)) {
    const url = new URL(specifier);

    switch (url.protocol) {
      case "jsr:":
      case "https:":
      case "http:":
      case "npm:": {
        const specifier = url.toString();
        const sourceFile = await info(specifier);
        const redirects = new Map<string, string>(
          Object.entries(sourceFile.redirects),
        );
        const normalized = redirects.has(specifier)
          ? redirects.get(specifier)!
          : specifier;

        const modules = new Map<string, ModuleEntry>(
          sourceFile.modules.map((entry) => [entry.specifier, entry]),
        );

        module = modules.get(normalized);

        if (!module) throw new Error("Module not found");

        const result = await moduleResolve(module, sourceFile, ctx);
        source = sourceFile;
        resolved = result.url;
        mediaType = result.mediaType;

        break;
      }

      case "node:":
      case "file:":
      case "data:": {
        resolved = url;
        break;
      }

      default: {
        throw new Error("Unknown");
      }
    }
  } else if (
    ["/", "./", "../"].some((value) => specifier.startsWith(value))
  ) {
    if (ctx.module && ctx.source) {
      if ("error" in ctx.module) {
        throw new Error(ctx.module.error);
      }

      if (ctx.module.kind !== "esm") {
        resolved = new URL(specifier, referrerURL);
      } else {
        const deps = new Map(
          ctx.module.dependencies?.map((dep) => [dep.specifier, dep]),
        );
        const dependency = deps.get(specifier);

        if (!dependency) throw new Error("Dependency not found");

        if (dependency.npmPackage) {
          throw new Error("not supported");
        }

        const modules = new Map(
          ctx.source.modules.map((module) => [module.specifier, module]),
        );

        module = modules.get(dependency.code.specifier);

        if (!module) throw new Error("Module not found");

        const result = await moduleResolve(module, ctx.source, ctx);

        resolved = result.url;
        mediaType = result.mediaType;
      }
    } else {
      resolved = new URL(specifier, referrerURL);
    }
  } else if (specifier.startsWith("#")) {
    // 1. Set resolved to the result of PACKAGE_IMPORTS_RESOLVE(specifier, parentURL, defaultConditions).
    resolved = await PACKAGE_IMPORTS_RESOLVE(
      specifier as `#${string}`,
      referrerURL,
      ctx.conditions,
      ctx,
    );
  } // 5. Otherwise,
  else {
    // 1. Note: specifier is now a bare specifier.
    // 2. Set resolved the result of PACKAGE_RESOLVE(specifier, parentURL).
    const result = await resolve(`npm:${specifier}`, referrerURL, ctx);
    resolved = result.url;
    module = result.module;
    source = result.source;
    mediaType = result.mediaType;
  }

  let realURL: URL = resolved;

  if (resolved.protocol === "file:") {
    realURL = await ctx.realUrl(resolved);
  }

  if (!mediaType) {
    const format = await esmFileFormat(realURL, ctx);

    if (format) {
      switch (format) {
        case "module": {
          mediaType = "Mjs";
          break;
        }

        case "commonjs": {
          mediaType = "Cjs";
          break;
        }
        case "json": {
          mediaType = "Json";
          break;
        }
        case "wasm": {
          mediaType = "Wasm";
          break;
        }
      }
    } else {
      mediaType = "Unknown";
    }
  }

  return { url: realURL, module, source, mediaType };
}
