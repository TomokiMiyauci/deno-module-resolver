import { type EsmModule } from "../../deps.ts";
import { cacheInfoResolve } from "../cache_info_resolve.ts";
import type { ResolveResult } from "../types.ts";

export function esmResolve(module: EsmModule): ResolveResult {
  const url = cacheInfoResolve(module);

  return { url, mediaType: module.mediaType };
}
