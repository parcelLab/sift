import { Query, Filter } from "./types";

/**
 * Terminology
 *
 * Query refers to the document that is passed to the compiler / mongodb find that holds
 *   the query conditions (can be multiple),
 *   e.g. { "fruits.type": { "$eq": "berry", "$ne": "aggregate" }, "fruits": { "$size": 3 }}
 *
 * Cond (conditions) refers to a single path-expression pair,
 *   e.g. { "fruits.type": { "$eq": "berry", "$ne": "aggregate" }
 *
 * Path refers to dot-separated fields,
 *   e.g. "fruits.type"
 *
 * Exp (expression) refers to the object that holds operator and value pairs (can be multiple),
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

const cmpOps = new Set([
	"$eq",
	"$gt",
	"$gte",
	"$in",
	"$lt",
	"$lte",
	"$ne",
	"$nin",
]);

/**
 * Compiles a mongo filter query into a filter function
 */
export function compile(query: Query, options: CompilerOptions = {}): Filter {
	let str = '"use strict"; ';

	const sc = new SymbolCounter();
	const logicalSets = new Set();

	for (const cond in query) {
		const exp = query[cond];

		if (typeof exp !== "object") {
			/** when exp is not an object, it's an implicit $eq where the ov is exp */
			let varSym = sc.inc();
			logicalSets.add(varSym);

			str += `const ${varSym} = ${docSym}.${cond} === ${JSON.stringify(exp)}; `;
		} else if (Object.keys(exp).some((k) => !cmpOps.has(k))) {
			/**
			 * when exp has keys that aren't ops, it's an explicit object match where
			 * each key/value has to strictly match
			 */
			let varSym = sc.inc();
			logicalSets.add(varSym);

			const ov = JSON.stringify(exp);

			str += `const ${varSym} = JSON.stringify(${docSym}.${cond}) === ${JSON.stringify(ov)}; `;
		} else {
			for (const op in exp) {
				if (op === "$eq") {
					const ov = exp[op];

					let varSym = sc.inc();
					logicalSets.add(varSym);

					str += `const ${varSym} = ${docSym}.${cond} === ${JSON.stringify(ov)}; `;
				}
			}
		}
	}

	const retSym = sc.inc();

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
