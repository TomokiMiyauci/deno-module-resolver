import {
  MediaType,
  ModuleEntry,
  SourceFileInfo,
} from "../modules/deno/info.ts";
import { esmResolve } from "./esm_resolve.ts";
import { npmResolve } from "./npm_resolve.ts";
import { type Context } from "./context.ts";

export async function moduleResolve(
  module: ModuleEntry,
  source: SourceFileInfo,
  ctx: Context,
): Promise<{ url: URL; mediaType: MediaType }> {
  if ("error" in module) {
    throw new Error(module.error);
  }

  switch (module.kind) {
    case "esm": {
      return esmResolve(module);
    }

    case "npm": {
      const url = await npmResolve(module, source, ctx);

      return {
        url,
        mediaType: "Unknown",
      };
    }

    case "asserted":
    case "json":
    case "node": {
      throw new Error("not supported");
    }
  }
}
