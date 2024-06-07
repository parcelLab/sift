import { describe } from "vitest";
import { TestCase } from "./util";
import { runTestCases } from "./util";

describe("mongo test cases", async () => {
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

	runTestCases(testCases);
});
