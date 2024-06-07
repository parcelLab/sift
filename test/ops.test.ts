import { randomBytes } from "node:crypto";
import { describe, expect, test } from "vitest";
import { compile } from "../src/compiler";
import { TestCase } from "../src/types";
import { db, getExpectedMongoDocs } from "./mongo";

describe("$eq", async () => {
	const testCases: TestCase[] = [
		{
			name: "simple $eq against string",
			filter: { foo: { $eq: "bar" } },
			input: [{ foo: "bar" }, {}, { foo: "baz" }, { foo: { foo: "bar" } }],
			expected: [{ foo: "bar" }],
		},
		{
			name: "implicit $eq",
			filter: { foo: "bar" },
			input: [{ foo: "bar" }, {}, { foo: "baz" }, { foo: { foo: "bar" } }],
			expected: [{ foo: "bar" }],
		},
		{
			name: "explicit object match",
			filter: { foo: { bar: 1, $size: 2 } },
			input: [
				{ foo: "bar" },
				{},
				{ foo: [{ bar: 1 }, { bar: 2 }] },
				{ foo: { bar: 1, $size: 2 } },
			],
			expected: [{ foo: { bar: 1, $size: 2 } }],
		},
	];

	runTestCases(testCases);
});

describe("$and", async () => {
	const testCases: TestCase[] = [
		{
			name: "implicit: multiple object paths",
			filter: { foo: { $eq: "bar" }, qux: { $eq: "baz" } },
			input: [{ foo: "bar", qux: "baz" }, { foo: "bar" }, {}, { foo: "baz" }],
			expected: [{ foo: "bar", qux: "baz" }],
		},
	];

	runTestCases(testCases);
});

function runTestCases(testCases: TestCase[]) {
	for (const testCase of testCases) {
		test(testCase.name, testCase.opts, async (c) => {
			c.onTestFailed(() => {
				console.log("DEBUG for", c.task.name);
				compile(testCase.filter, { debug: true });
			});

			const filterFn = compile(testCase.filter);
			const actual = testCase.input.filter(filterFn);
			const mongoExpected = await getExpectedMongoDocs(testCase);

			expect(actual).toEqual(mongoExpected);
			expect(actual).toEqual(testCase.expected);
		});
	}
}
