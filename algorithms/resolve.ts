import { type Context, type Info } from "./context.ts";
import { MediaType } from "../modules/deno/info.ts";
import { moduleResolve } from "./module_resolve.ts";
import { esmFileFormat } from "../deps.ts";
import { urlResolve } from "./url_resolve.ts";

interface ResolveResult {
  url: URL;
  mediaType: MediaType;
  info?: Info;
}

export async function resolve(
  specifier: string,
  referrerURL: URL | string,
  ctx: Context,
): Promise<ResolveResult> {
  // 1. Let resolved be undefined.
  let resolved: URL;
  let mediaType: MediaType | undefined;
  let info: Info | undefined;

  if (URL.canParse(specifier)) {
    const result = await urlResolve(specifier, ctx);

    resolved = result.url;
    info = result.info;
    mediaType = result.mediaType;
  } else if (
    ["/", "./", "../"].some((value) => specifier.startsWith(value))
  ) {
    if (ctx.info) {
      if ("error" in ctx.info.module) {
        throw new Error(ctx.info.module.error);
      }

      if (ctx.info.module.kind !== "esm") {
        resolved = new URL(specifier, referrerURL);
      } else {
        const deps = new Map(
          ctx.info.module.dependencies?.map((dep) => [dep.specifier, dep]),
        );
        const dependency = deps.get(specifier);

        if (!dependency) throw new Error("Dependency not found");

        if (dependency.npmPackage) {
          throw new Error("not supported");
        }

        const modules = new Map(
          ctx.info.source.modules.map((module) => [module.specifier, module]),
        );

        const module = modules.get(dependency.code.specifier);

        if (!module) throw new Error("Module not found");

        const result = await moduleResolve(module, ctx.info.source, ctx);

        resolved = result.url;
        mediaType = result.mediaType;
        info = { module, source: ctx.info.source };
      }
    } else {
      resolved = new URL(specifier, referrerURL);
    }
  } else if (specifier.startsWith("#")) {
    throw new Error("imports field is not supported in npm module");
    // 1. Set resolved to the result of PACKAGE_IMPORTS_RESOLVE(specifier, parentURL, defaultConditions).
    // resolved = await PACKAGE_IMPORTS_RESOLVE(
    //   specifier as `#${string}`,
    //   referrerURL,
    //   ctx.conditions,
    //   ctx,
    // );
  } // 5. Otherwise,
  else {
    // 1. Note: specifier is now a bare specifier.
    // 2. Set resolved the result of PACKAGE_RESOLVE(specifier, parentURL).
    const result = await urlResolve(`npm:/${specifier}`, ctx);
    resolved = result.url;
    mediaType = result.mediaType;
    info = result.info;
  }

  const realURL = resolved.protocol === "file:"
    ? await ctx.realUrl(resolved) ?? resolved
    : resolved;

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

  return { url: realURL, info, mediaType };
}
