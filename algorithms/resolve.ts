import { type Context, type ResolveOptions } from "./types.ts";
import { type MediaType } from "../deps.ts";
import { urlResolve } from "./url_resolve.ts";
import { packageResolve } from "./package_resolve.ts";
import { localResolve } from "./local_resolve.ts";

interface ResolveResult {
  url: URL;
  mediaType: MediaType;
  context?: Context;
}

export async function resolve(
  specifier: string,
  referrerURL: URL | string,
  options: ResolveOptions,
): Promise<ResolveResult> {
  // 1. Let resolved be undefined.
  let resolved: URL;
  let mediaType: MediaType;
  let context: Context | undefined = options.context;

  if (URL.canParse(specifier)) {
    const result = await urlResolve(specifier, options);

    resolved = result.url;
    mediaType = result.mediaType;
    context = result.context;
  } else if (
    ["/", "./", "../"].some((value) => specifier.startsWith(value))
  ) {
    const result = await localResolve(specifier, referrerURL, options);

    resolved = result.url;
    mediaType = result.mediaType;
    if ("context" in result) context = result.context;
  } else if (specifier.startsWith("#")) {
    throw new Error("imports field is not supported in npm module");
    // 1. Set resolved to the result of PACKAGE_IMPORTS_RESOLVE(specifier, parentURL, defaultConditions).
    // resolved = await PACKAGE_IMPORTS_RESOLVE(
    //   specifier as `#${string}`,
    //   referrerURL,
    //   options.conditions,
    //   options,
    // );
  } // 5. Otherwise,
  else {
    // 1. Note: specifier is now a bare specifier.
    // 2. Set resolved the result of PACKAGE_RESOLVE(specifier, parentURL).

    if (!options.context) throw new Error("outside of package");

    const result = await packageResolve(specifier, {
      ...options,
      context: options.context,
    });

    resolved = result.url;
    mediaType = result.mediaType;

    if ("context" in result) context = result.context;
  }

  const realURL = resolved.protocol === "file:"
    ? await options.realUrl(resolved) ?? resolved
    : resolved;

  return { url: realURL, context, mediaType };
}
