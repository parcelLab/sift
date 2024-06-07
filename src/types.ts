type CmpOp = "$eq";

type OpValue = any;

export type Query = {
	[path: string]: {
		[op in CmpOp]: OpValue;
	};
};

export type Filter = (value: unknown) => boolean;
