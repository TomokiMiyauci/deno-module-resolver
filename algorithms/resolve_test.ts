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
    expect(result.local).toBeTruthy();
    expect(result.mediaType).toBe("TypeScript");
  });

  it("should throw error if the specifier is not supported", async () => {
    const result = await resolve("jsr:@std/testing/bdd", import.meta.url);

    await expect(resolve("./wrong", result.url, { context: result.context }))
      .rejects.toThrow();
  });

  it("should resolve node build-in module", async () => {
    const result = await resolve("node:crypto", import.meta.url);

    expect(result.url).toEqual(new URL("node:crypto"));
    expect(result.context).toBeTruthy();
    expect(result.local).toBe(null);
    expect(result.mediaType).toBe("Unknown");
  });

  it("should resolve data scheme", async () => {
    const result = await resolve(
      "data:text/javascript,console.log(0);",
      import.meta.url,
    );

    expect(result.url).toEqual(new URL("data:text/javascript,console.log(0);"));
    expect(result.context).toBeTruthy();
    expect(result.local).toBe(null);
    expect(result.mediaType).toBe("JavaScript");
  });

  it("should resolve commonjs npm specifier", async () => {
    const result = await resolve("npm:react@18.2.0", import.meta.url);

    expect(result.context).toBeTruthy();
    expect(result.local).toBeTruthy();
    expect(result.mediaType).toBe("Cjs");

    console.log(result);
  });

  it("should resolve as local URL", async () => {
    const npmResult = await resolve("npm:react@18.2.0", import.meta.url);
    const result = await resolve(
      "./cjs/react.production.min.js",
      npmResult.url,
    );

    expect(result.context).toBeFalsy();
    expect(result.local).toBeTruthy();
    expect(result.mediaType).toBe("JavaScript");
  });

  it("should resolve npm specifier", async () => {
    const npmResult = await resolve("npm:react@18.2.0", import.meta.url);
    const result = await resolve(
      "./cjs/react.production.min.js",
      npmResult.url,
      { context: npmResult.context },
    );

    expect(result.local).toBeTruthy();
    expect(result.mediaType).toBe("Cjs");
  });
});
