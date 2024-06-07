import { Db, MongoClient } from "mongodb";
import { deepStrictEqual } from "node:assert";
import { TestContext, after, before } from "node:test";
import { compile } from "../src/compiler";
import { Query } from "../src/types";
import { randomBytes } from "node:crypto";

export type TestCase = {
	name: string;
	skip?: true;
	only?: true;
	todo?: true;
	filter: Query;
	input: any[];
	expected: any[];
};

let mongo: MongoClient;
let db: Db;

before(async () => {
	const mongoUrl =
		process.env["TEST_MONGODB_URL"] ?? "mongodb://localhost:27017";
	mongo = new MongoClient(mongoUrl, { forceServerObjectId: true });
	await mongo.connect();
	db = mongo.db("test");
});

after(async () => {
	await db.dropDatabase();
	await mongo.close();
});

export async function runTestCases(testCases: TestCase[], t: TestContext) {
	const collection = db.collection("test" + randomBytes(8).toString("hex"));

	for (const testCase of testCases) {
		const testOptions: any = {};
		if (testCase.todo) testOptions.todo = true;
		if (testCase.skip) testOptions.skip = true;
		if (testCase.only) testOptions.only = true;

		await t.test(testCase.name, testOptions, async () => {
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
