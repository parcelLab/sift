import { describe, expect, test } from "vitest";
import { deepCompare } from "../src/utils";
import { TestCase } from "../src/types";

describe("deepCheck", () => {
	describe("checks against object properties", () => {
		const cases: TestCase[] = [
			{
				name: "normal prop access",
				query: { path: ["foo"], value: "bar" },
				input: { foo: "bar" },
				expected: true,
			},
			{
				name: "normal prop access",
				query: { path: ["baz"], value: "bar" },
				input: { foo: "bar" },
				expected: false,
			},
			{
				name: "deep prop access",
				query: { path: ["foo", "baz"], value: "bar" },
				input: { foo: { baz: "bar" } },
				expected: true,
			},
			{
				name: "deep prop access",
				query: { path: ["foo", "baz"], value: "bar" },
				input: { foo: { baz: "bla" } },
				expected: false,
			},
			{
				name: "deep prop access",
				query: { path: ["foo", "baz"], value: "bar" },
				input: { foo: {} },
				expected: false,
			},
			{
				name: "deep prop access (null)",
				query: { path: ["foo", "baz"], value: null },
				input: { foo: {} },
				expected: true,
			},
			{
				name: "deep prop access (null)",
				query: { path: ["foo", "baz"], value: null },
				input: { foo: { baz: 1 } },
				expected: false,
			},
			{
				name: "deep prop access (null)",
				query: { path: ["foo", "baz"], value: null },
				input: { foo: { baz: false } },
				expected: false,
			},
			{
				name: "deep prop access (null)",
				query: { path: ["foo", "baz"], value: null },
				input: { foo: { baz: null } },
				expected: true,
			},
			{
				name: "deep prop access (null)",
				query: { path: ["foo", "bar"], value: null },
				input: { foo: { bar: null } },
				expected: true,
			},
		];

		test.each(cases)("$name", ({ query, input, expected }) => {
			expect(deepCompare(input, query.path, query.value)).toBe(expected);
		});
	});

	describe("checks against array indices", () => {
		const cases: TestCase[] = [
			{
				name: "normal array access",
				query: { path: ["0"], value: "bar" },
				input: ["bar"],
				expected: true,
			},
			{
				name: "normal array access",
				query: { path: ["0"], value: "bar" },
				input: ["bla"],
				expected: false,
			},
			{
				name: "deep array access",
				query: { path: ["0", "baz"], value: "bar" },
				input: [{ baz: "bar" }],
				expected: true,
			},
			{
				name: "deep array access",
				query: { path: ["0", "baz"], value: "bar" },
				input: [{ baz: "bla" }],
				expected: false,
			},
			{
				name: "deep array access",
				query: { path: ["0", "baz"], value: "bar" },
				input: [{}],
				expected: false,
			},
			{
				name: "deep array access (null)",
				query: { path: ["0", "baz"], value: null },
				input: [{}],
				expected: true,
			},
			{
				name: "deep array access (null)",
				query: { path: ["1", "baz"], value: null },
				input: [{}],
				expected: true,
			},
			{
				name: "deep array access (null)",
				query: { path: ["0", "baz"], value: null },
				input: [{ baz: 1 }],
				expected: false,
			},
			{
				name: "deep array access (null)",
				query: { path: ["0", "baz"], value: null },
				input: [{ baz: false }],
				expected: false,
			},
		];

		test.each(cases)("$name", ({ query, input, expected }) => {
			expect(deepCompare(input, query.path, query.value)).toBe(expected);
		});
	});

	describe("checks against intermediate arrays in object path", () => {
		const cases: TestCase[] = [
			{
				name: "array in obj access",
				query: { path: ["foo"], value: "bar" },
				input: { foo: ["bar"] },
				expected: true,
			},
			{
				name: "array in obj access",
				query: { path: ["foo"], value: "bar" },
				input: { foo: ["bla"] },
				expected: false,
			},
			{
				name: "obj array obj",
				query: { path: ["foo", "0", "baz"], value: "bar" },
				input: { foo: [{ baz: "bar" }] },
				expected: true,
			},
			{
				name: "obj array obj",
				query: { path: ["foo", "0", "baz"], value: "bar" },
				input: { foo: [{ baz: "bla" }] },
				expected: false,
			},
			{
				name: "obj array obj",
				query: { path: ["foo", "0", "baz"], value: "bar" },
				input: { foo: [{}] },
				expected: false,
			},
			{
				name: "obj array obj",
				query: { path: ["foo", "0", "baz"], value: null },
				input: { foo: [{}] },
				expected: true,
			},
			{
				name: "obj array obj",
				query: { path: ["foo", "0", "baz"], value: null },
				input: { foo: [null] },
				expected: true,
			},
			{
				name: "obj array obj",
				query: { path: ["foo", "0", "baz"], value: "bar" },
				input: { foo: [null] },
				expected: false,
			},
			{
				name: "obj array obj",
				query: { path: ["foo", "0", "baz"], value: "bar" },
				input: { foo: [1] },
				expected: false,
			},
			{
				name: "obj array obj",
				query: { path: ["foo", "0", "baz"], value: "bar" },
				input: { foo: ["bar"] },
				expected: false,
			},
			{
				name: "obj array obj",
				query: { path: ["foo", "0", "baz"], value: null },
				input: { foo: [1] },
				expected: true,
			},
			{
				name: "obj array obj",
				query: { path: ["foo", "0", "baz"], value: null },
				input: { foo: ["bar"] },
				expected: true,
			},
			{
				name: "obj array obj",
				query: { path: ["foo", "0", "baz"], value: null },
				input: { foo: [{ baz: 1 }] },
				expected: false,
			},
			{
				name: "obj array obj",
				query: { path: ["foo", "0", "baz"], value: null },
				input: { foo: [{ baz: false }] },
				expected: false,
			},
		];

		test.each(cases)("$name", ({ query, input, expected }) => {
			expect(deepCompare(input, query.path, query.value)).toBe(expected);
		});
	});

	describe("array against array", () => {
		const cases: TestCase[] = [
			{
				name: "array against array",
				query: { path: ["foo"], value: ["bar"] },
				input: { foo: ["bar"] },
				expected: true,
			},
			{
				name: "array against array",
				query: { path: ["foo"], value: ["bar"] },
				input: { foo: [["bar"]] },
				expected: true,
			},
		];

		test.each(cases)("$name", ({ query, input, expected }) => {
			expect(deepCompare(input, query.path, query.value)).toBe(expected);
		});
	});

	describe("null cases", () => {
		const cases: TestCase[] = [
			{
				name: "unindexed nested object path against null",
				query: { path: ["foo", "bar"], value: null },
				input: { foo: ["bar"] },
				expected: true,
			},
			{
				name: "unindexed nested object path against null",
				query: { path: ["foo", "bar"], value: null },
				input: { foo: [{ bar: "baz" }] },
				expected: false,
			},
		];

		test.each(cases)("$name", ({ query, input, expected }) => {
			expect(deepCompare(input, query.path, query.value)).toBe(expected);
		});
	});
});
