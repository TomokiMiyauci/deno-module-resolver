import { esmResolve } from "./esm_resolve.ts";
import { npmResolve } from "./npm_resolve.ts";
import { jsonResolve } from "./json_resolve.ts";
import type { MediaType, SourceFileInfo } from "../deps.ts";
import { type Context, type ValidModule } from "./context.ts";

export interface ModuleResolveResult {
  url: URL;
  mediaType?: MediaType;
}

export async function moduleResolve(
  module: ValidModule,
  source: SourceFileInfo,
  ctx: Context,
): Promise<ModuleResolveResult> {
  switch (module.kind) {
    case "esm": {
      return esmResolve(module);
    }

    case "npm": {
      const url = await npmResolve(module, source, ctx);

      return { url };
    }

    case "node": {
      return { url: new URL(module.specifier) };
    }

    case "asserted":
    case "json": {
      return jsonResolve(module);
    }
  }
}
