import { Query, Filter } from "./types";

/**
 * Terminology
 *
 * Query refers to the document that is passed to the compiler / mongodb find,
 *   e.g. { "fruits.type": { "$eq": "berry", "$ne": "aggregate" }, "fruits": { "$size": 3 }}
 *   and can contain multiple conditions
 *
 * Cond (conditions) refers to a single path-expression pair,
 *   e.g. { "fruits.type": { "$eq": "berry", "$ne": "aggregate" }
 *
 * Path refers to dot-separated fields,
 *   e.g. "fruits.type"
 *
 * Exp (expression) refers to the object that holds multiple operator and value pairs,
 *   e.g. { "$eq": "berry", "$ne": "aggregate" }
 *
 * Op (operator) refers to the logical operator that is matched against the value,
 *   e.g. "$eq"
 *
 * Ov (operator value) refers to the value that you are matching against in
 *   the context of a single operator e.g. "berry"
 *
 * Doc refers to the object that is passed to the compiled filter function
 */

/** Symbols */
const docSym = "doc";

interface CompilerOptions {
	/** Debug mode, dumps the function string into console */
	debug?: boolean;
}

/**
 * Compiles a mongo filter query into a filter function
 */
export function compile(query: Query, options: CompilerOptions = {}): Filter {
	let str = '"use strict"; ';

	const SC = new SymbolCounter();
	const logicalSets = new Set();

	for (const path in query) {
		const pathOps = query[path];

		for (const op in pathOps) {
			if (op === "$eq") {
				const opValue = pathOps[op];

				let varSym = SC.inc();
				logicalSets.add(varSym);

				str += `const ${varSym} = ${docSym}.${path} === ${JSON.stringify(opValue)}; `;
			}
		}
	}

	const retSym = SC.inc();

	if (logicalSets.size > 0) {
		str += `const ${retSym} = ${Array.from(logicalSets).join(" && ")}; `;
	} else {
		str += `const ${retSym} = true; `;
	}

	str += `return ${retSym}`;

	if (options.debug) {
		console.log(str);
	}

	return new Function(docSym, str) as Filter;
}

class SymbolCounter {
	constructor(
		private count: number = 0,
		private prefix: string = "s_",
	) {}

	inc() {
		this.count++;
		return `${this.prefix}${this.count}`;
	}
}
