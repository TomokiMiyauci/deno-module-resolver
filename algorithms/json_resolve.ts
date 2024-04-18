import type { ModuleEntryAsserted, ModuleEntryJson } from "../deps.ts";
import { cacheInfoResolve } from "./cache_info_resolve.ts";

export function jsonResolve(module: ModuleEntryJson | ModuleEntryAsserted) {
  const url = cacheInfoResolve(module);

  return { url, mediaType: module.mediaType };
}
