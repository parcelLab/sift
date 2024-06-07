import { Collection, MongoClient } from "mongodb";
import { deepStrictEqual } from "node:assert";
import { TestContext, after, before, beforeEach } from "node:test";
import { compile } from "../src/compiler";
import { TestCase } from "../src/types";

let mongo: MongoClient;
export let collection: Collection;

before(async () => {
	const mongoUrl =
		process.env["TEST_MONGODB_URL"] ?? "mongodb://localhost:27017";
	mongo = new MongoClient(mongoUrl, { forceServerObjectId: true });
	await mongo.connect();
	const db = mongo.db("test");
	collection = db.collection("test");
});

after(async () => {
	await mongo.close();
});

beforeEach(async () => {
	await collection.deleteMany();
});

export async function runTestCases(testCases: TestCase[], t: TestContext) {
	for (const testCase of testCases) {
		if ("todo" in testCase) {
			t.todo(testCase.name);
			continue;
		}

		if ("skip" in testCase) {
			t.skip(testCase.name);
			continue;
		}

		await t.test(testCase.name, async () => {
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
