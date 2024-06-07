import { describe } from "vitest";
import { TestCase } from "./util";
import { runTestCases } from "./util";

describe("$eq", async () => {
	const testCases: TestCase[] = [
		{
			name: "simple $eq against string",
			filter: { foo: { $eq: "bar" } },
			input: [{ foo: "bar" }, {}, { foo: "baz" }, { foo: { foo: "bar" } }],
			expected: [{ foo: "bar" }],
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
		{
			name: "multiple operators on the same path",
			todo: true,
			filter: {},
			input: [{}],
			expected: [{}],
		},
	];

	runTestCases(testCases);
});
