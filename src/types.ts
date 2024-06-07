import { TestOptions } from "vitest";

type CmpOp = "$eq";

type OpValue = any;

export type Query = {
	[path: string]:
		| {
				[op in CmpOp]: OpValue;
		  }
		| OpValue;
};

export type Filter = (value: unknown) => boolean;

export type TestCase = {
	name: string;
	filter: Query;
	input: any[];
	expected: any[];

	opts?: TestOptions;
};
