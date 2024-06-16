import { randomBytes } from "crypto";
import { MongoClient } from "mongodb";
import { TestCase } from "../src/types.js";

const mongoUrl = process.env["TEST_MONGODB_URL"] ?? "mongodb://localhost:27017";
export const mongo = new MongoClient(mongoUrl, { forceServerObjectId: true });
export const db = mongo.db("test");
export async function getExpectedMongoDocs(testCase: TestCase) {
	const collection = db.collection("test" + randomBytes(12).toString("hex"));
	await collection.insertMany(testCase.input);
	const mongoExpected = await collection
		.find(testCase.query, { projection: { _id: 0 } })
		.toArray();
	return mongoExpected;
}
