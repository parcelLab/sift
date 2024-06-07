import { test } from "node:test";
import { TestCase } from "../src/types";
import { runTestCases } from "./util";

test("random mongo test cases", async (t) => {
	const testCases: TestCase[] = [
		{
			/** seems to work with multiple comparison operators like an implicit $and */
			name: "multiple ops in same path",
			filter: { foo: { $eq: "bar", $in: ["bar", "baz"] } } as any,
			input: [{ foo: "bar" }, {}, { foo: "baz" }, { foo: { foo: "bar" } }],
			expected: [{ foo: "bar" }],
		},
	];

	await runTestCases(testCases, t);
});
