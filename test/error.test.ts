import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { compile } from "../src/compiler";

beforeAll(() => {
	vi.stubGlobal("JSON", {
		parse: vi.fn().mockReturnValue(""),
		stringify: vi.fn().mockReturnValue(""),
	});
});

afterAll(() => {
	vi.unstubAllGlobals();
});

test("compiling an invalid query will throw an error", () => {
	expect(() => compile({ foo: "bar" }, { debug: true })).toThrow();
});
