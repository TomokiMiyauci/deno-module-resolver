import { MediaType, SourceFileInfo } from "../modules/deno/info.ts";
import { esmResolve } from "./esm_resolve.ts";
import { npmResolve } from "./npm_resolve.ts";
import { type Context, type ValidModule } from "./context.ts";

export async function moduleResolve(
  module: ValidModule,
  source: SourceFileInfo,
  ctx: Context,
): Promise<{ url: URL; mediaType?: MediaType }> {
  switch (module.kind) {
    case "esm": {
      return esmResolve(module);
    }

    case "npm": {
      const url = await npmResolve(module, source, ctx);

      return { url };
    }

    case "asserted":
    case "json":
    case "node": {
      throw new Error("not supported");
    }
  }
}
