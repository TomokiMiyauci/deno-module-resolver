import { isBuiltin } from "../deps.ts";
import { urlResolve } from "./url_resolve.ts";
import {
  type Context,
  ModuleResolveResult,
  type ResolveOptions,
  type ResolveResult,
} from "./types.ts";

export async function packageResolve(
  specifier: string,
  options: ResolveOptions & { context: Context },
): Promise<ModuleResolveResult | ResolveResult> {
  if (isBuiltin(specifier)) {
    const url = new URL(`node:${specifier}`);

    return { url, mediaType: "Unknown" };
  } else {
    if (options.context.module.kind !== "npm") {
      throw new Error("module should be npm");
    }

    const npm =
      options.context.source.npmPackages[options.context.module.npmPackage];

    if (!npm) throw new Error("no npm");

    const { name, subpath } = parseNpmPkg(specifier);

    let pkg: string;
    if (npm.name === name) {
      pkg = `npm:/${npm.name}@${npm.version}${subpath.slice(1)}`;
    } else {
      const depsMap = new Map<string, string>(
        npm.dependencies.map((nameWithVersion) => {
          const name = extractName(nameWithVersion);
          return [name, nameWithVersion];
        }),
      );

      const nameWithVer = depsMap.get(name);

      if (!nameWithVer) {
        console.log("no name with version", specifier);

        pkg = `npm:/${specifier}${subpath.slice(1)}`;
      } else {
        const dep = options.context.source.npmPackages[nameWithVer];

        pkg = `npm:/${dep.name}@${dep.version}${subpath.slice(1)}`;
      }
    }

    const result = await urlResolve(pkg, options);

    return result;
  }
}

function parseNpmPkg(specifier: string) {
  const index = specifier.startsWith("@")
    ? secondIndexOf(specifier, "/")
    : specifier.indexOf("/");

  const name = index === -1 ? specifier : specifier.slice(0, index);

  return {
    name,
    subpath: `.${specifier.slice(name.length)}`,
  };
}

function extractName(input: string): string {
  const at = input.startsWith("@")
    ? secondIndexOf(input, "@")
    : input.indexOf("@");
  return at === -1 ? input : input.slice(0, at);
}

function secondIndexOf(input: string, searchString: string): number {
  const firstIndex = input.indexOf(searchString);

  if (firstIndex === -1) return -1;

  return input.indexOf(searchString, firstIndex + 1);
}
