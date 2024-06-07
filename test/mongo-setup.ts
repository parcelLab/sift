import { db, mongo } from "./mongo";

export async function setup() {
	await mongo.connect();
}

export async function teardown() {
	await db.dropDatabase();
	await mongo.close();
}
