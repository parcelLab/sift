import sift from "sift";
import { describe, expect, test } from "vitest";
import { compile } from "../src/compiler";
import { TestCase } from "../src/types";
import { getExpectedMongoDocs } from "./mongo";

describe("$eq", async () => {
	const testCases: TestCase[] = [
		{
			name: "explicit $eq",
			query: { foo: { $eq: "bar" } },
			input: [{ foo: "bar" }, {}, { foo: "baz" }, { foo: { foo: "bar" } }],
			expected: [{ foo: "bar" }],
		},
		{
			name: "implicit $eq",
			query: { foo: "bar" },
			input: [{ foo: "bar" }, {}, { foo: "baz" }, { foo: { foo: "bar" } }],
			expected: [{ foo: "bar" }],
		},
		{
			name: "implicit $eq, full object match",
			query: { foo: { bar: 1, $size: 2 } },
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
			query: { foo: { $eq: { bar: 1, $size: 2 } } },
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
			query: { "foo.bar": { $eq: "baz" } },
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
			query: { "foo.bar": "baz" },
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
			query: { "foo.bar": { baz: "qux", $eq: "bar" } },
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
			query: { "foo.bar": { baz: "qux" } },
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
			query: { "foo.bar": null },
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
			query: { "foo.bar": { $eq: null } },
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
			query: { "foo.bar": ["baz"] },
			input: [
				{ foo: { bar: "baz" } },
				{ foo: { bar: ["baz"] } },
				{ foo: { bar: [["baz"]] } },
				{ foo: { bar: ["baz", ["baz"]] } },
				{ foo: { bar: ["baz", "bar"] } },
				{},
				{ foo: "bar" },
				{ foo: [{ bar: "qux" }] },
			],
			expected: [
				{ foo: { bar: ["baz"] } },
				{ foo: { bar: [["baz"]] } },
				{ foo: { bar: ["baz", ["baz"]] } },
			],
		},
		{
			name: "match against arrays on doc",
			query: { "foo.bar": "baz" },
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
			query: { "a.b.c.d": 1 },
			input: [
				{ a: { b: { c: [{ d: [1] }] } } },
				{ a: [{ b: [{ c: [{ d: 1 }] }] }] },
				{ a: [{ b: { c: [{ d: 1 }] } }] },
				{ a: { b: { c: [null, { d: 1 }] } } },
				{ a: [{ b: [{ c: [{ d: 2 }] }] }] },
				{ a: {} },
				{},
			],
			expected: [
				{ a: { b: { c: [{ d: [1] }] } } },
				{ a: [{ b: [{ c: [{ d: 1 }] }] }] },
				{ a: [{ b: { c: [{ d: 1 }] } }] },
				{ a: { b: { c: [null, { d: 1 }] } } },
			],
		},
		{
			name: "unindexed nested object path against null",
			query: { "foo.bar": null },
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
			query: { "foo.1.bar": "baz" },
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
			query: { "foo.bar.baz": "qux" },
			input: [
				{ foo: [{ bar: [{ baz: "qux" }] }] },
				{},
				{ foo: "bar" },
				{ foo: [{ bar: "baz" }] },
			],
			expected: [{ foo: [{ bar: [{ baz: "qux" }] }] }],
		},
	];

	runTestCases(testCases);
});

describe("$and", async () => {
	const testCases: TestCase[] = [
		{
			name: "implicit: multiple object paths",
			query: { foo: { $eq: "bar" }, qux: { $eq: "baz" } },
			input: [{ foo: "bar", qux: "baz" }, { foo: "bar" }, {}, { foo: "baz" }],
			expected: [{ foo: "bar", qux: "baz" }],
		},
		{
			name: "multiple conditions",
			query: {
				"foo.bar.baz": "qux",
				"foo.bar.qux": "baz",
				"foo.bar.bla": "jaz",
			},
			input: [
				{ foo: [{ bar: [{ baz: "qux" }, { qux: "baz" }, { bla: "jaz" }] }] },
				{},
				{ foo: "bar" },
				{ foo: [{ bar: "baz" }] },
			],
			expected: [
				{ foo: [{ bar: [{ baz: "qux" }, { qux: "baz" }, { bla: "jaz" }] }] },
			],
		},
	];

	runTestCases(testCases);
});

function runTestCases(testCases: TestCase[]) {
	for (const testCase of testCases) {
		test(testCase.name, testCase.opts, async (c) => {
			c.onTestFailed(() => {
				console.log("DEBUG:", c.task.name);
				compile(testCase.query, { debug: true });
			});

			const filterFn = compile(testCase.query, {
				debug: testCase.opts?.debug === true,
			});
			const actual = testCase.input.filter(filterFn);
			const mongoExpected = await getExpectedMongoDocs(testCase);

			expect(testCase.expected).toEqual(mongoExpected);
			expect(actual).toEqual(mongoExpected);
			expect(actual).toEqual(testCase.expected);

			if (!testCase.siftDiff) {
				const siftResult = testCase.input.filter(sift(testCase.query));
				expect(siftResult).toEqual(mongoExpected);
			}
		});
	}
}
