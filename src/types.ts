import { TestOptions } from "vitest";

export type CmpOp =
	| "$eq"
	| "$gt"
	| "$gte"
	| "$in"
	| "$lt"
	| "$lte"
	| "$ne"
	| "$nin";

export const cmpOps = new Set([
	"$eq",
	"$gt",
	"$gte",
	"$in",
	"$lt",
	"$lte",
	"$ne",
	"$nin",
]);

export type OpValue = string | number | object | null | undefined;

export type Exp = { [op in CmpOp]: OpValue };

export type Query = {
	[path: string]: Exp | OpValue;
};

export type Filter = (value: unknown) => boolean;

export type TestCase = {
	name: string;
	query: Query;
	input: any[];
	expected: any[];

	opts?: TestOptions;

	siftDiff?: boolean;
};
