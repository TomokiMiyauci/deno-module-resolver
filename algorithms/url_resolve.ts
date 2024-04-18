import { moduleResolve } from "./module_resolve.ts";
import { type Context, type ValidModule } from "./context.ts";
import {
  type MediaType,
  type ModuleEntry,
  type SourceFileInfo,
} from "../deps.ts";

export interface URLResolveResult {
  url: URL;
  mediaType?: MediaType;
  info?: {
    module: ValidModule;
    source: SourceFileInfo;
  };
}

export async function urlResolve(
  specifier: URL | string,
  ctx: Context,
): Promise<URLResolveResult> {
  const url = new URL(specifier);

  switch (url.protocol) {
    case "jsr:":
    case "https:":
    case "http:":
    case "npm:": {
      const specifier = url.toString();
      const sourceFile = await ctx.getInfo(specifier);
      const redirects = new Map<string, string>(
        Object.entries(sourceFile.redirects),
      );
      const normalized = redirects.has(specifier)
        ? redirects.get(specifier)!
        : specifier;

      const modules = new Map<string, ModuleEntry>(
        sourceFile.modules.map((entry) => [entry.specifier, entry]),
      );

      const module = modules.get(normalized);

      if (!module) throw new Error("Module not found");
      if ("error" in module) throw new Error(module.error);

      const result = await moduleResolve(module, sourceFile, ctx);

      return {
        url: result.url,
        mediaType: result.mediaType,
        info: { module, source: sourceFile },
      };
    }

    case "node:":
    case "file:":
    case "data:": {
      return { url };
    }

    default: {
      const scheme = url.protocol.slice(0, url.protocol.length - 1);
      throw new Error(
        `Unsupported scheme "${scheme}" for module "${url}". Supported schemes: [
        "data",
        // "blob",
        "file",
        "http",
        "https",
        "jsr",
        "npm"
    ]`,
      );
    }
  }
}
