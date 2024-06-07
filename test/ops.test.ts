import { describe, expect, test } from "vitest";
import { compile } from "../src/compiler";
import { TestCase } from "../src/types";
import { getExpectedMongoDocs } from "./mongo";

describe("$eq", async () => {
	const testCases: TestCase[] = [
		{
			name: "explicit $eq",
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
			name: "implicit $eq, full object match",
			filter: { foo: { bar: 1, $size: 2 } },
			input: [
				{ foo: "bar" },
				{},
				{ foo: [{ bar: 1 }, { bar: 2 }] },
				{ foo: { bar: 1, $size: 2 } },
			],
			expected: [{ foo: { bar: 1, $size: 2 } }],
		},
		{
			name: "explicit $eq, full object match",
			filter: { foo: { $eq: { bar: 1, $size: 2 } } },
			input: [
				{ foo: "bar" },
				{},
				{ foo: [{ bar: 1 }, { bar: 2 }] },
				{ foo: { bar: 1, $size: 2 } },
			],
			expected: [{ foo: { bar: 1, $size: 2 } }],
		},
		{
			name: "nested object path, explicit $eq",
			filter: { "foo.bar": { $eq: "baz" } },
			input: [
				{ foo: { bar: "baz" } },
				{},
				{ foo: "bar" },
				{ foo: { bar: "qux" } },
			],
			expected: [{ foo: { bar: "baz" } }],
		},
		{
			name: "nested object path, implicit $eq",
			filter: { "foo.bar": "baz" },
			input: [
				{ foo: { bar: "baz" } },
				{},
				{ foo: "bar" },
				{ foo: { bar: "qux" } },
			],
			expected: [{ foo: { bar: "baz" } }],
		},
		{
			name: "nested object path, full object match",
			filter: { "foo.bar": { baz: "qux" } },
			input: [
				{ foo: { bar: { baz: "qux" } } },
				{ foo: { bar: { baz: "qux", bla: "jaz" } } },
				{},
				{ foo: "bar" },
				{ foo: { bar: "baz" } },
			],
			expected: [{ foo: { bar: { baz: "qux" } } }],
		},
		{
			name: "nested object path with arrays",
			filter: { "foo.bar": "baz" },
			input: [
				{ foo: [{ bar: "baz" }] },
				{},
				{ foo: "bar" },
				{ foo: [{ bar: "qux" }] },
			],
			expected: [{ foo: [{ bar: "baz" }] }],
			opts: { todo: true },
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
				console.log("DEBUG:", c.task.name);
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
