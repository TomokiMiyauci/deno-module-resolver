import { MediaType, Module, Source } from "../deps.ts";

export interface ResolveOptions {
  readFile(url: URL): Promise<string | null>;
  existDir(url: URL): Promise<boolean>;
  existFile(url: URL): Promise<boolean>;
  realUrl(url: URL): Promise<URL | null | undefined> | URL | null | undefined;
  inspect(specifier: string): Promise<Source>;

  /**
   * If {@link module} is "esm":
   * @default ["deno", "node", "imports"]
   *
   * If {@link module} is "cjs":
   * @default ["node", "require"]
   */
  conditions: Iterable<string>;

  context?: Context | null;
  npm: NpmOptions;

  /**
   * @default esm
   */
  module?: "esm" | "cjs";

  /**
   * @default false
   */
  bareNodeBuiltins?: boolean;
}

export interface Context {
  source: Source;
  module: Module;
}

interface NpmGlobalOptions {
  type: "global";
  denoDir: string;
}

interface NpmLocalOptions {
  type: "local";
  baseURL: URL;
}

export type NpmOptions = NpmGlobalOptions | NpmLocalOptions;

export interface ResolveResult {
  url: URL;
  mediaType: MediaType;

  /** File URL represent to local path.
   */
  local: string | null;
}

export interface ModuleResolveResult extends ResolveResult {
  context: Context;
}
