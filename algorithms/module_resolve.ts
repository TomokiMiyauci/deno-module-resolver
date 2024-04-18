import { esmResolve } from "./esm_resolve.ts";
import { npmResolve } from "./npm_resolve.ts";
import { jsonResolve } from "./json_resolve.ts";
import type { Module, SourceFileInfo } from "../deps.ts";
import { type Context, ResolveResult } from "./types.ts";

export async function moduleResolve(
  module: Module,
  source: SourceFileInfo,
  ctx: Context,
): Promise<ResolveResult> {
  switch (module.kind) {
    case "esm": {
      return esmResolve(module);
    }

    case "npm": {
      const result = await npmResolve(module, source, ctx);

      return result;
    }

    case "node": {
      return { url: new URL(module.specifier), mediaType: "Unknown" };
    }

    case "asserted":
    case "json": {
      return jsonResolve(module);
    }
  }
}
