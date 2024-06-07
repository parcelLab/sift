import { test } from "vitest";
import { strictEqual } from "node:assert";
import { compile } from "../src/compiler";

test("compile returns function that takes a value and returns a boolean", () => {
	const filter = compile({});

	strictEqual(typeof filter, "function");

	const output = filter({});

	strictEqual(typeof output, "boolean");
});
