import { expect, expectTypeOf, test } from "vitest";
import { compile } from "../src/compiler";

test("compile returns function that takes a value and returns a boolean", () => {
	const filter = compile({});

	expectTypeOf(filter).toBeFunction();

	const output = filter({});

	expectTypeOf(output).toBeBoolean();
});

test("compiling with debug options returns comments with stack", () => {
	const filter = compile({ foo: "bar", baz: { $eq: "qux" } }, { debug: true });

	expect(filter.toString()).toContain("/*");
});
