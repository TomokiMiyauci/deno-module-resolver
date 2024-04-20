import { moduleResolve } from "./module_resolve.ts";
import { type ModuleResolveResult, type ResolveOptions } from "./types.ts";
import { type ModuleEntry } from "../deps.ts";

/**
 * @throws {Error}
 */
export async function urlResolve(
  specifier: URL | string,
  options: ResolveOptions,
): Promise<ModuleResolveResult> {
  const url = new URL(specifier);

  switch (url.protocol) {
    case "jsr:":
    case "https:":
    case "http:":
    case "npm:":
    case "node:":
    case "file:":
    case "data:": {
      const specifier = url.toString();
      const sourceFile = await options.inspect(specifier);
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

      const result = await moduleResolve(module, sourceFile, options);

      return {
        url: result.url,
        mediaType: result.mediaType,
        context: { module, source: sourceFile },
      };
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
