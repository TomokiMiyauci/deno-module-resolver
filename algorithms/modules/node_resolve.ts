import type { NodeModule } from "../../deps.ts";
import type { ResolveResult } from "../types.ts";

export function nodeResolve(module: NodeModule): ResolveResult {
  const url = new URL(module.specifier);

  return { url, mediaType: "Unknown", local: null };
}
