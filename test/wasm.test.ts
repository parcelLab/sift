import { expect, expectTypeOf, test } from "vitest";

import { compile } from "../src/compiler.js";

import { add } from "../build/debug.js";

test("wasm import and runs", () => {
	expect(add(1, 2)).toEqual(3);
});

test("compile-wasm returns compile", () => {
	const filter = compile({ foo: { $eq: "bar" } });

	expectTypeOf(filter).toBeFunction();

	const output = filter({});

	expectTypeOf(output).toBeBoolean();
});
