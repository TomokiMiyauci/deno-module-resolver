import { esmResolve } from "./esm_resolve.ts";
import { npmResolve } from "./npm_resolve.ts";
import { jsonResolve } from "./json_resolve.ts";
import { assertedResolve } from "./asserted_resolve.ts";
import type { Module, SourceFileInfo } from "../deps.ts";
import { type Context, ResolveResult } from "./types.ts";

export function moduleResolve(
  module: Module,
  source: SourceFileInfo,
  ctx: Context,
): Promise<ResolveResult> | ResolveResult {
  switch (module.kind) {
    case "esm": {
      return esmResolve(module);
    }

    case "npm": {
      return npmResolve(module, source, ctx);
    }

    case "node": {
      return { url: new URL(module.specifier), mediaType: "Unknown" };
    }

    case "asserted": {
      return assertedResolve(module);
    }

    case "json": {
      return jsonResolve(module);
    }
  }
}
