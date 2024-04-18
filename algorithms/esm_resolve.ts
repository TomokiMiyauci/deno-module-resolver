import { MediaType, ModuleEntryEsm } from "../modules/deno/info.ts";
import { cacheInfoResolve } from "./cache_info_resolve.ts";

export function esmResolve(
  module: ModuleEntryEsm,
): { url: URL; mediaType: MediaType } {
  const url = cacheInfoResolve(module);

  return { url, mediaType: module.mediaType };
}
