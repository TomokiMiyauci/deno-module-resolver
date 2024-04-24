import { isBuiltin, NpmModule } from "../deps.ts";
import { urlResolve } from "./url_resolve.ts";
import {
  type Context,
  ModuleResolveResult,
  type ResolveOptions,
  type ResolveResult,
} from "./types.ts";
import { npmResolve } from "./modules/npm_resolve.ts";

export async function packageResolve(
  specifier: string,
  options: ResolveOptions & { context: Context },
): Promise<ModuleResolveResult | ResolveResult> {
  if (isBuiltin(specifier)) {
    const url = new URL(`node:${specifier}`);

    return { url, mediaType: "Unknown", local: null };
  }

  if (options.context.module.kind !== "npm") {
    throw new Error("module should be npm");
  }

  const npm =
    options.context.source.npmPackages[options.context.module.npmPackage];

  if (!npm) throw new Error("no npm");

  const { name, subpath } = parseNpmPkg(specifier);

  if (npm.name === name) {
    const module = {
      kind: "npm",
      specifier: `npm:/${npm.name}@${npm.version}${subpath.slice(1)}`,
      npmPackage: options.context.module.npmPackage,
    } satisfies NpmModule;

    return {
      ...await npmResolve(module, options.context.source, options),
      context: {
        module,
        source: options.context.source,
      },
    };
  }

  const depsMap = new Map<string, string>(
    npm.dependencies.map((nameWithVersion) => {
      const name = extractName(nameWithVersion);
      return [name, nameWithVersion];
    }),
  );

  const nameWithVersion = depsMap.get(name);
  const dep = nameWithVersion &&
    options.context.source.npmPackages[nameWithVersion];

  if (dep) {
    const module = {
      kind: "npm",
      specifier: `npm:/${dep.name}@${dep.version}${subpath.slice(1)}`,
      npmPackage: nameWithVersion,
    } satisfies NpmModule;

    return {
      ...await npmResolve(module, options.context.source, options),
      context: {
        module,
        source: options.context.source,
      },
    };
  }

  // The case where dependencies cannot be detected is when optional: true in peerDependency.
  // In this case, version resolution is left to the user
  const pkg = `npm:/${specifier}${subpath.slice(1)}`;
  const url = new URL(pkg);

  return urlResolve(url, options);
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
