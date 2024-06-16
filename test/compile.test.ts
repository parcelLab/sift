import { expectTypeOf, test } from "vitest";
import { compile } from "../src/compiler.js";

test("compile returns function that takes a value and returns a boolean", () => {
	const filter = compile({});

	expectTypeOf(filter).toBeFunction();

	const output = filter({});

	expectTypeOf(output).toBeBoolean();
});
