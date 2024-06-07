import { MongoClient, Collection } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { test, before, after, beforeEach } from "node:test";
import { deepStrictEqual } from "node:assert";
import { compile } from "../src/compiler";
import { TestCase } from "../src/types";

let mongod: MongoMemoryServer;
let mongo: MongoClient;
let collection: Collection;

before(async () => {
	mongod = await MongoMemoryServer.create();
	const uri = mongod.getUri();
	mongo = new MongoClient(uri, { forceServerObjectId: true });
	await mongo.connect();
	const db = mongo.db("test");
	collection = db.collection("test");
});

after(async () => {
	await mongo.close();
	await mongod.stop();
});

beforeEach(async () => {
	await collection.deleteMany();
});

test("$eq", async (t) => {
	await t.test("implict equality with string opvalue", async (t) => {
		const testCases: TestCase[] = [
			{
				filter: { foo: { $eq: "bar" } },
				input: [
					{ foo: "bar" },
					{},
					{ foo: "baz" },
					{ foo: { foo: "bar" } },
				],
				expected: [{ foo: "bar" }],
			},
		];

		for (const testCase of testCases) {
			await t.test(async () => {
				const filterFn = compile(testCase.filter);
				const actual = testCase.input.filter(filterFn);

				await collection.insertMany(testCase.input);
				const mongoExpected = await collection
					.find(testCase.filter, { projection: { _id: 0 } })
					.toArray();

				deepStrictEqual(actual, mongoExpected);
				deepStrictEqual(actual, testCase.expected);
			});
		}
	});
});
