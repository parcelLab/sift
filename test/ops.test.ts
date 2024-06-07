import sift from "sift";
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
			siftDiff: true,
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
			filter: { "foo.bar": { baz: "qux", $eq: "bar" } },
			input: [
				{ foo: { bar: { baz: "qux", $eq: "bar" } } },
				{ foo: { bar: { baz: "qux", bla: "jaz" } } },
				{},
				{ foo: "bar" },
				{ foo: { bar: "baz" } },
			],
			expected: [{ foo: { bar: { baz: "qux", $eq: "bar" } } }],
			siftDiff: true,
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
			name: "implicit $eq, object against null",
			filter: { "foo.bar": null },
			input: [
				{ foo: { bar: null } },
				{ foo: { bar: "baz" } },
				{ foo: null },
				{ foo: "bar" },
				{},
			],
			expected: [{ foo: { bar: null } }, { foo: null }, { foo: "bar" }, {}],
		},
		{
			name: "explicit $eq, object against null",
			filter: { "foo.bar": { $eq: null } },
			input: [
				{ foo: { bar: null } },
				{ foo: { bar: "baz" } },
				{ foo: null },
				{ foo: "bar" },
				{},
			],
			expected: [{ foo: { bar: null } }, { foo: null }, { foo: "bar" }, {}],
		},
		{
			name: "match against arrays on ov",
			filter: { "foo.bar": ["baz"] },
			input: [
				{ foo: { bar: "baz" } },
				{ foo: { bar: ["baz"] } },
				{ foo: { bar: [["baz"]] } },
				{ foo: { bar: ["baz", "bar"] } },
				{},
				{ foo: "bar" },
				{ foo: [{ bar: "qux" }] },
			],
			expected: [{ foo: { bar: ["baz"] } }, { foo: { bar: [["baz"]] } }],
		},
		{
			name: "match against arrays on doc",
			filter: { "foo.bar": "baz" },
			input: [
				{ foo: { bar: ["bar"] } },
				{ foo: { bar: ["baz", "bar"] } },
				{},
				{ foo: "bar" },
				{ foo: [{ bar: "qux" }] },
			],
			expected: [{ foo: { bar: ["baz", "bar"] } }],
		},
		{
			name: "unindexed nested object path with intermediate arrays on doc",
			filter: { "foo.bar": "baz" },
			input: [
				{ foo: [{ bar: "baz" }] },
				{},
				{ foo: "bar" },
				{ foo: [{ bar: "qux" }] },
			],
			expected: [{ foo: [{ bar: "baz" }] }],
		},
		{
			name: "unindexed nested object path against null",
			filter: { "foo.bar": null },
			input: [
				{ foo: [{ bar: "baz" }] },
				{},
				{ foo: "bar" },
				{ foo: { bar: null } },
				{ foo: [{ bar: "qux" }] },
			],
			expected: [{}, { foo: "bar" }, { foo: { bar: null } }],
		},
		{
			name: "indexed nested object path with intermediate arrays on doc",
			filter: { "foo.1.bar": "baz" },
			input: [
				{ foo: [{}, { bar: "baz" }] },
				{ foo: [{ bar: "baz" }, {}] },
				{},
				{ foo: "bar" },
				{ foo: [{ bar: "qux" }] },
			],
			expected: [{ foo: [{}, { bar: "baz" }] }],
		},
		{
			name: "nested arrays on doc",
			filter: { "foo.bar.baz": "qux" },
			input: [
				{ foo: [{ bar: [{ baz: "qux" }] }] },
				{},
				{ foo: "bar" },
				{ foo: [{ bar: "baz" }] },
			],
			expected: [{ foo: [{ bar: [{ baz: "qux" }] }] }],
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

			expect(testCase.expected).toEqual(mongoExpected);
			expect(actual).toEqual(mongoExpected);
			expect(actual).toEqual(testCase.expected);

			if (!testCase.siftDiff) {
				const siftResult = testCase.input.filter(sift(testCase.filter));
				expect(siftResult).toEqual(mongoExpected);
			}
		});
	}
}
