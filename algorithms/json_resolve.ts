import type { JsonModule } from "../deps.ts";
import { cacheInfoResolve } from "./cache_info_resolve.ts";
import type { ResolveResult } from "./types.ts";

export function jsonResolve(module: JsonModule): ResolveResult {
  const url = cacheInfoResolve(module);

  return { url, mediaType: module.mediaType };
}
