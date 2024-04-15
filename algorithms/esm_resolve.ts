import { MediaType, ModuleEntryEsm } from "../modules/deno/info.ts";
import { toFileUrl } from "jsr:@std/path";

export function esmResolve(
  module: ModuleEntryEsm,
): { url: URL; mediaType: MediaType } {
  if (module.local === null) throw new Error();

  return { url: toFileUrl(module.local), mediaType: module.mediaType };
}
