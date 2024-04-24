import {
  extname,
  type Format,
  type MediaType,
  type ModuleEntry,
  type Source,
} from "../deps.ts";
import { moduleResolve } from "./modules/module_resolve.ts";
import type { ModuleResolveResult, ResolveOptions } from "./types.ts";
import { Msg } from "./constants.ts";

export function mediaTypeFromExt(url: URL): MediaType {
  const ext = extname(url);

  switch (ext) {
    case ".js":
      return "JavaScript";

    case ".ts":
      return "TypeScript";

    case ".tsx":
      return "TSX";

    case ".jsx":
      return "JSX";

    case ".mjs":
      return "Mjs";

    case ".cjs":
      return "Cjs";

    case ".json":
      return "Json";

    case ".wasm":
      return "Wasm";

    case ".tsbuildinfo":
      return "TsBuildInfo";

    case ".map":
      return "SourceMap";

    default:
      return "Unknown";
  }
}

export async function resolveModuleLike(
  moduleEntry: ModuleEntry | undefined,
  source: Source,
  options: Pick<
    ResolveOptions,
    "npm" | "existDir" | "existFile" | "readFile" | "conditions"
  >,
): Promise<ModuleResolveResult> {
  if (!moduleEntry) throw new Error(Msg.ModuleEntryNotFound);
  if ("error" in moduleEntry) throw new Error(moduleEntry.error);

  const module = moduleEntry;
  const result = await moduleResolve(module, source, options);

  return {
    url: result.url,
    mediaType: result.mediaType,
    local: result.local,
    context: { module, source },
  };
}

export function formatToMediaType(format: Format): MediaType {
  switch (format) {
    case "module":
      return "JavaScript";

    case "commonjs":
      return "Cjs";

    case "json":
      return "Json";

    case "wasm":
      return "Wasm";
  }
}
