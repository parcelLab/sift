import { test } from "node:test";
import { TestCase } from "./util";
import { runTestCases } from "./util";

test("mongo test cases", async (t) => {
	const testCases: TestCase[] = [
		{
			name: "empty filter {} should match everything",
			only: true,
			filter: {},
			input: [{ foo: "bar" }, {}, { foo: "baz" }, { foo: { foo: "bar" } }],
			expected: [{ foo: "bar" }, {}, { foo: "baz" }, { foo: { foo: "bar" } }],
		},
		{
			/** seems to work with multiple comparison operators like an implicit $and */
			name: "multiple ops in same path",
			skip: true,
			filter: { foo: { $eq: "bar", $in: ["bar", "baz"] } } as any,
			input: [{ foo: "bar" }, {}, { foo: "baz" }, { foo: { foo: "bar" } }],
			expected: [{ foo: "bar" }],
		},
	];

	await runTestCases(testCases, t);
});
