import { type EsmModule } from "../../deps.ts";
import type { ResolveResult } from "../types.ts";

export function esmResolve(module: EsmModule): ResolveResult {
  const url = new URL(module.specifier);

  return { url, mediaType: module.mediaType, local: module.local ?? null };
}
