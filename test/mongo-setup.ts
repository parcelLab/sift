import { db, mongo } from "./mongo.js";

export async function setup() {
	await mongo.connect();
}

export async function teardown() {
	await db.dropDatabase();
	await mongo.close();
}
