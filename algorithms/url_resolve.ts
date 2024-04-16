import { moduleResolve } from "./module_resolve.ts";
import { info, ModuleEntry } from "../modules/deno/info.ts";
import { type Context } from "./context.ts";

export async function urlResolve(specifier: URL | string, ctx: Context) {
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

      const module = modules.get(normalized);

      if (!module) throw new Error("Module not found");

      const result = await moduleResolve(module, sourceFile, ctx);

      return {
        url: result.url,
        mediaType: result.mediaType,
        info: {
          source: sourceFile,
          module,
        },
      };
    }

    case "node:":
    case "file:":
    case "data:": {
      return { url };
    }

    default: {
      throw new Error("Unknown");
    }
  }
}
