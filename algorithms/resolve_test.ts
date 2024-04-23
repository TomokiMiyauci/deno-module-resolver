import { describe, expect, it } from "../dev_deps.ts";
import { resolve } from "./resolve.ts";

describe("resolve", () => {
  it("should resolve jsr specifier", async () => {
    const result = await resolve(
      "jsr:@std/testing@0.221.0/bdd",
      import.meta.url,
    );

    expect(result.url).toEqual(
      new URL("https://jsr.io/@std/testing/0.221.0/bdd.ts"),
    );
    expect(result.local).not.toBeFalsy();
    expect(result.mediaType).toBe("TypeScript");
  });

  it("should resolve local specifier under the jsr module", async () => {
    const jsr = await resolve(
      "jsr:@std/testing@0.221.0/bdd",
      import.meta.url,
    );
    const result = await resolve("./_test_suite.ts", jsr.url, {
      context: jsr.context,
    });

    expect(result.url).toEqual(
      new URL("https://jsr.io/@std/testing/0.221.0/_test_suite.ts"),
    );
    expect(result.local).not.toBeFalsy();
    expect(result.mediaType).toBe("TypeScript");
  });

  it("should throw error if the specifier is not supported", async () => {
    const result = await resolve("jsr:@std/testing/bdd", import.meta.url);

    await expect(resolve("./wrong", result.url, { context: result.context }))
      .rejects.toThrow();
  });
});
