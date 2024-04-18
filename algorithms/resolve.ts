import { type Context, type Info } from "./types.ts";
import { extname, type MediaType } from "../deps.ts";
import { urlResolve } from "./url_resolve.ts";
import { packageResolve } from "./package_resolve.ts";
import { localResolve } from "./local_resolve.ts";

interface ResolveResult {
  url: URL;
  mediaType: MediaType;
  info?: Info;
}

export async function resolve(
  specifier: string,
  referrerURL: URL | string,
  ctx: Context,
): Promise<ResolveResult> {
  // 1. Let resolved be undefined.
  let resolved: URL;
  let mediaType: MediaType | undefined;
  let info: Info | undefined = ctx.info;

  if (URL.canParse(specifier)) {
    const result = await urlResolve(specifier, ctx);

    resolved = result.url;
    info = result.info;
    mediaType = result.mediaType;
  } else if (
    ["/", "./", "../"].some((value) => specifier.startsWith(value))
  ) {
    const result = await localResolve(specifier, referrerURL, ctx);

    resolved = result.url;
    mediaType = result.mediaType;

    if (result.info) {
      info = result.info;
    }
  } else if (specifier.startsWith("#")) {
    throw new Error("imports field is not supported in npm module");
    // 1. Set resolved to the result of PACKAGE_IMPORTS_RESOLVE(specifier, parentURL, defaultConditions).
    // resolved = await PACKAGE_IMPORTS_RESOLVE(
    //   specifier as `#${string}`,
    //   referrerURL,
    //   ctx.conditions,
    //   ctx,
    // );
  } // 5. Otherwise,
  else {
    // 1. Note: specifier is now a bare specifier.
    // 2. Set resolved the result of PACKAGE_RESOLVE(specifier, parentURL).

    if (!ctx.info) throw new Error("outside of package");

    const result = await packageResolve(specifier, { ...ctx, info: ctx.info });

    resolved = result.url;

    if ("mediaType" in result) {
      mediaType = result.mediaType;
      info = result.info;
    }
  }

  let realURL = resolved;

  if (resolved.protocol === "file:") {
    realURL = await ctx.realUrl(resolved);

    if (!mediaType) {
      mediaType = mediaTypeFromExt(realURL);
    }
  }

  return { url: realURL, info, mediaType: mediaType ?? "Unknown" };
}

function mediaTypeFromExt(url: URL): MediaType {
  const ext = extname(url);

  switch (ext) {
    case ".js":
      return "JavaScript";
    case ".ts":
      return "TypeScript";

    case ".tsx":
      return "TSX";

    case ".jsx":
      return "JSX";

    case ".mjs":
      return "Mjs";

    case ".cjs":
      return "Cjs";

    case ".json":
      return "Json";

    case ".wasm":
      return "Wasm";

    case ".tsbuildinfo":
      return "TsBuildInfo";

    case ".map":
      return "SourceMap";

    default:
      return "Unknown";
  }
}
