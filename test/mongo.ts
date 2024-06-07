import { MongoClient } from "mongodb";

const mongoUrl = process.env["TEST_MONGODB_URL"] ?? "mongodb://localhost:27017";
export const mongo = new MongoClient(mongoUrl, { forceServerObjectId: true });
export const db = mongo.db("test");
