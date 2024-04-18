export interface Context {
  readFile(
    path: string,
  ): Promise<string | null | undefined> | string | null | undefined;
  existFile(path: string): Promise<boolean>;
  existDir(path: string): Promise<boolean>;

  /**
   * @default ["node", "require"]
   */
  conditions?: Iterable<string>;
}
