import { deepStrictEqual } from "node:assert";
import { randomBytes } from "node:crypto";
import { test } from "vitest";
import { compile } from "../src/compiler";
import { Query } from "../src/types";
import { db } from "./mongo";

export type TestCase = {
	name: string;
	skip?: true;
	only?: true;
	todo?: true;
	filter: Query;
	input: any[];
	expected: any[];
};

export function runTestCases(testCases: TestCase[]) {
	const collection = db.collection("test" + randomBytes(8).toString("hex"));

	for (const testCase of testCases) {
		const testOptions: any = {};
		if (testCase.todo) testOptions.todo = true;
		if (testCase.skip) testOptions.skip = true;
		if (testCase.only) testOptions.only = true;

		test(testCase.name, testOptions, async () => {
			const filterFn = compile(testCase.filter);
			const actual = testCase.input.filter(filterFn);

			await collection.insertMany(testCase.input);
			const mongoExpected = await collection
				.find(testCase.filter, { projection: { _id: 0 } })
				.toArray();

			deepStrictEqual(actual, mongoExpected, "Failed mongo comparison");
			deepStrictEqual(actual, testCase.expected, "Failed expected comparison");
		});
	}
}
