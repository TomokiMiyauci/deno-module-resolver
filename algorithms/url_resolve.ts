import { moduleResolve } from "./module_resolve.ts";
import { type ModuleResolveResult, type ResolveOptions } from "./types.ts";

/**
 * @throws {Error}
 */
export async function urlResolve(
  url: URL,
  options: ResolveOptions,
): Promise<ModuleResolveResult> {
  const specifier = url.toString();
  const source = await options.inspect(specifier);
  const normalized = source.redirects[specifier] ?? specifier;
  const moduleEntry = source.modules.find((entry) =>
    entry.specifier === normalized
  );

  if (!moduleEntry) throw new Error("Module not found");
  if ("error" in moduleEntry) throw new Error(moduleEntry.error);

  const module = moduleEntry;
  const result = await moduleResolve(module, source, options);

  return {
    url: result.url,
    mediaType: result.mediaType,
    context: { module, source },
  };
}
