import type { AssertedModule, JsonModule } from "../deps.ts";
import { cacheInfoResolve } from "./cache_info_resolve.ts";

export function jsonResolve(module: AssertedModule | JsonModule) {
  const url = cacheInfoResolve(module);

  return { url, mediaType: module.mediaType };
}
