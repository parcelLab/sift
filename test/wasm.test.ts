import { expect, test } from "vitest";

import { compile as compileJs } from "../src/compiler";
import { compile as compileAs } from "../src/compiler-wasm";

import { add } from "../build/debug.js";

test("wasm import and runs", () => {
	expect(add(1, 2)).toEqual(3);
});

test("compile-wasm returns compile", () => {
	const filter = { foo: { $eq: "bar" } };
	const jsOutput = compileJs(filter).toString();
	const asOutput = compileAs(filter).toString();

	expect(jsOutput).toEqual(asOutput);
});
