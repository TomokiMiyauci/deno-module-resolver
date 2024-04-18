import { type CacheInfo, toFileUrl } from "../deps.ts";

export function cacheInfoResolve(cacheInfo: CacheInfo): URL {
  const { local } = cacheInfo;

  if (typeof local !== "string") throw new Error("local file does not exist");

  const url = toFileUrl(local);

  return url;
}
