import { test } from "node:test";
import { TestCase } from "../src/types";
import { runTestCases } from "./util";

test("$and", async (t) => {
	const testCases: TestCase[] = [
		{
			name: "multiple object paths",
			filter: { foo: { $eq: "bar" }, qux: { $eq: "baz" } },
			input: [{ foo: "bar", qux: "baz" }, { foo: "bar" }, {}, { foo: "baz" }],
			expected: [{ foo: "bar", qux: "baz" }],
		},
		{
			name: "multiple operators on the same path",
			todo: true,
		},
	];

	await runTestCases(testCases, t);
});

test("$eq", async (t) => {
	const testCases: TestCase[] = [
		{
			name: "simple $eq against string",
			filter: { foo: { $eq: "bar" } },
			input: [{ foo: "bar" }, {}, { foo: "baz" }, { foo: { foo: "bar" } }],
			expected: [{ foo: "bar" }],
		},
	];

	await runTestCases(testCases, t);
});
