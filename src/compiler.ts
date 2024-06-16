import { Filter, Query, cmpOps } from "./types.js";

// import { genEq } from "../assembly/index.js"; // uncomment for easier debugging
import { genEq } from "../build/release.js";

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

/**
 * Compiles a mongo filter query into a filter function
 */
export function compile(query: Query, options: CompilerOptions = {}): Filter {
	let str = '"use strict"; let results = true; ';

	let sc = 0;

	for (const path in query) {
		const expOrOv = query[path];

		const pathParts = [docSym, ...path.split(".")];

		/** When there are non-ops it the entire ov is used as a deep strict equal match */
		const isAllOps =
			expOrOv &&
			typeof expOrOv === "object" &&
			Object.keys(expOrOv).every((k) => cmpOps.has(k));

		if (isAllOps) {
			if ("$eq" in expOrOv) {
				const ovs = JSON.stringify(expOrOv["$eq"]);
				sc++;
				const ns = `s_${sc}`;
				str += genEq(ns, ovs, pathParts);
				str += `results = results && ${ns}; `;
			}
		} else {
			const ovs = JSON.stringify(expOrOv);
			sc++;
			const ns = `s_${sc}`;
			str += genEq(ns, ovs, pathParts);
			str += `results = results && ${ns}; `;
		}
	}

	str += `return results; `;

	if (options.debug) {
		console.log(str);
	}

	return new Function(docSym, str) as Filter;
}
