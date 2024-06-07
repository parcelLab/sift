import { describe, expect, test } from "vitest";
import { TestCase } from "../src/types";
import { getExpectedMongoDocs } from "./mongo";

describe("mongo test cases", async () => {
	const testCases: TestCase[] = [
		{
			name: "empty filter {} should match everything",
			filter: {},
			input: [{ foo: "bar" }, {}, { foo: "baz" }, { foo: { foo: "bar" } }],
			expected: [{ foo: "bar" }, {}, { foo: "baz" }, { foo: { foo: "bar" } }],
		},
		{
			name: "multiple explicit ops in same path",
			filter: { foo: { $nin: ["baz"], $in: ["bar", "baz"] } },
			input: [{ foo: "bar" }, {}, { foo: "baz" }, { foo: { foo: "bar" } }],
			expected: [{ foo: "bar" }],
		},
		{
			name: "mixed implicit and explicit ops in same path is a strict object match",
			filter: { foo: { bar: 1, $size: 2 } },
			input: [
				{ foo: "bar" },
				{},
				{ foo: "baz" },
				{ foo: [{ bar: 1 }, { bar: 2 }] },
				{ foo: { bar: 1, $size: 2 } },
			],
			expected: [{ foo: { bar: 1, $size: 2 } }],
		},
	];

	runTestCases(testCases);
});

function runTestCases(testCases: TestCase[]) {
	for (const testCase of testCases) {
		test(testCase.name, testCase.opts, async () => {
			const mongoExpected = await getExpectedMongoDocs(testCase);

			expect(mongoExpected).toEqual(testCase.expected);
		});
	}
}
