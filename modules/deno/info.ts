/**
 * @throws {Error}
 */
export async function info(): Promise<CacheInfo>;
export async function info(file: string): Promise<SourceFileInfo>;
export async function info(file?: string): Promise<CacheInfo | SourceFileInfo> {
  const options = {
    args: ["info", "--json"],
    env: { "DENO_NO_PACKAGE_JSON": "true" },
    stdout: "piped",
    stderr: "inherit",
  } satisfies Deno.CommandOptions;

  if (typeof file === "string") options.args.push(file);

  const output = await new Deno.Command(Deno.execPath(), options).output();

  if (!output.success) {
    throw new Error(`Failed to call 'deno info' on '${file}'`);
  }
  const txt = new TextDecoder().decode(output.stdout);

  return JSON.parse(txt);
}

export interface CacheInfo {
  denoDir: string;
  modulesCache: string;
  npmCache: string;
  typescriptCache: string;
  registryCache: string;
  originStorage: string;
}

export interface SourceFileInfo {
  roots: string[];
  modules: ModuleEntry[];
  redirects: Record<string, string>;
  packages: Record<string, string>;
  npmPackages: Record<string, NpmPackage>;
}

export interface NpmPackage {
  name: string;
  version: string;
  dependencies: string[];
}

export type ModuleEntry =
  | ModuleEntryError
  | ModuleEntryEsm
  | ModuleEntryJson
  | ModuleEntryNpm
  | ModuleEntryNode;

export interface ModuleEntryBase {
  specifier: string;
}

export interface ModuleEntryError extends ModuleEntryBase {
  error: string;
}

// Lifted from https://raw.githubusercontent.com/denoland/deno_graph/89affe43c9d3d5c9165c8089687c107d53ed8fe1/lib/media_type.ts
export type MediaType =
  | "JavaScript"
  | "Mjs"
  | "Cjs"
  | "JSX"
  | "TypeScript"
  | "Mts"
  | "Cts"
  | "Dts"
  | "Dmts"
  | "Dcts"
  | "TSX"
  | "Json"
  | "Wasm"
  | "TsBuildInfo"
  | "SourceMap"
  | "Unknown";

export interface ModuleEntryEsm extends ModuleEntryBase {
  kind: "esm";
  dependencies?: Dependency[];
  local: string | null;
  emit: string | null;
  map: string | null;
  mediaType: MediaType;
  size: number;
}

export interface Dependency {
  specifier: string;
  code: Code;
  type?: {
    specifier: string;
    span: Span;
  };
  npmPackage?: string;
}

export interface Code {
  specifier: string;
  span: Span;
}

export interface Span {
  start: LineChar;
  end: LineChar;
}

export interface LineChar {
  line: number;
  character: number;
}

export interface ModuleEntryJson extends ModuleEntryBase {
  kind: "asserted" | "json";
  local: string | null;
  mediaType: MediaType;
  size: number;
}

export interface ModuleEntryNpm extends ModuleEntryBase {
  kind: "npm";
  npmPackage: string;
}

export interface ModuleEntryNode extends ModuleEntryBase {
  kind: "node";
  moduleName: string;
}
