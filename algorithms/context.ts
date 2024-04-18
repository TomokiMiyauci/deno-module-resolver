import {
  ModuleEntry,
  ModuleEntryError,
  SourceFileInfo,
} from "../modules/deno/info.ts";

export interface Context {
  readFile(url: URL): Promise<string | null>;
  conditions: Iterable<string>;
  existDir(url: URL): Promise<boolean>;
  existFile(url: URL): Promise<boolean>;
  realUrl(url: URL): Promise<URL>;

  getInfo(specifier: string): Promise<SourceFileInfo>;

  info?: Info;
  npm?: NpmOptions;

  /**
   * @default esm
   */
  module?: "esm" | "cjs";
}

export interface Info {
  source: SourceFileInfo;
  module: ValidModule;
}

export type ValidModule = Exclude<ModuleEntry, ModuleEntryError>;

interface NpmGlobalOptions {
  type: "global";
  denoDir: string;
}

interface NpmLocalOptions {
  type: "local";
  baseURL: URL;
}

export type NpmOptions = NpmGlobalOptions | NpmLocalOptions;
