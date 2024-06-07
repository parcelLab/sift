import { Query, Filter } from "./types";

const kDocVar = "doc";

export function compile(query: Query): Filter {
	let str = "";

	for (const path in query) {
		const pathOps = query[path];

		for (const op in pathOps) {
			if (op === "$eq") {
				const opValue = pathOps[op];

				str += `if (${kDocVar}.${path} === ${JSON.stringify(opValue)}) { return true }`;
			}
		}
	}

	str += `return false`;

	return new Function(kDocVar, str) as Filter;
}
