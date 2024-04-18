import { type EsmModule, type MediaType } from "../deps.ts";
import { cacheInfoResolve } from "./cache_info_resolve.ts";

export function esmResolve(
  module: EsmModule,
): { url: URL; mediaType: MediaType } {
  const url = cacheInfoResolve(module);

  return { url, mediaType: module.mediaType };
}
