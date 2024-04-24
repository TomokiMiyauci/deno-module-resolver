import type { AssertedModule } from "../../deps.ts";
import type { ResolveResult } from "../types.ts";

export function assertedResolve(module: AssertedModule): ResolveResult {
  const url = new URL(module.specifier);

  return { url, mediaType: module.mediaType, local: module.local ?? null };
}
