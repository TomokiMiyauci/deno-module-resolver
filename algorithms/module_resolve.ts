import { esmResolve } from "./esm_resolve.ts";
import { npmResolve } from "./npm_resolve.ts";
import { jsonResolve } from "./json_resolve.ts";
import { assertedResolve } from "./asserted_resolve.ts";
import type { Module, Source } from "../deps.ts";
import { type ResolveOptions, ResolveResult } from "./types.ts";

export function moduleResolve(
  module: Module,
  source: Source,
  options: ResolveOptions,
): Promise<ResolveResult> | ResolveResult {
  switch (module.kind) {
    case "esm": {
      return esmResolve(module);
    }

    case "npm": {
      return npmResolve(module, source, options);
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
