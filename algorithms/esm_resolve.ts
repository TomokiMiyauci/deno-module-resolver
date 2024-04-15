import { MediaType, ModuleEntryEsm } from "../modules/deno/info.ts";
import { toFileUrl } from "jsr:@std/path";

export function esmResolve(
  module: ModuleEntryEsm,
): { url: URL; mediaType: MediaType } {
  if (module.local === null) throw new Error("local file does not exist");

  const url = toFileUrl(module.local);

  return { url, mediaType: module.mediaType };
}
