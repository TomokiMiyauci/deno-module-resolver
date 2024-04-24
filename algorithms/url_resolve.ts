import { type ModuleResolveResult, type ResolveOptions } from "./types.ts";
import { resolveModuleLike } from "./utils.ts";

/**
 * @throws {Error}
 */
export async function urlResolve(
  url: URL,
  options: Pick<
    ResolveOptions,
    "npm" | "existDir" | "existFile" | "readFile" | "conditions" | "inspect"
  >,
): Promise<ModuleResolveResult> {
  const specifier = url.toString();
  const source = await options.inspect(specifier);
  const normalized = source.redirects[specifier] ?? specifier;
  const moduleEntry = source.modules.find((entry) =>
    entry.specifier === normalized
  );

  return resolveModuleLike(moduleEntry, source, options);
}
