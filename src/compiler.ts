import { Filter, OpValue, Query, cmpOps } from "./types";

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
	let str = '"use strict"; ';

	const sc = new SymbolCounter();
	const results: string[] = [];

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
				const ov = expOrOv["$eq"];
				str = genEq(str, sc, results, ov, pathParts);
			}
		} else {
			const ov = expOrOv as OpValue;
			str = genEq(str, sc, results, ov, pathParts);
		}
	}

	const retSym = sc.inc();

	if (results.length > 0) {
		str += `const ${retSym} = ${results.join(" && ")}; `;
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

type Mode = "and" | "or" | "nor";

function genEq(
	str: string,
	sc: SymbolCounter,
	results: string[],
	ov: OpValue,
	pathParts: string[],
) {
	const eqSym = sc.inc();
	results.push(eqSym);

	const safePath = pathParts.join("?.");

	const mode: Mode = ov == null ? "nor" : "or";
	const eqResults = [];

	for (let i = 1; i < pathParts.length; i++) {
		const firstPart = pathParts.slice(0, i + 1);
		const lastPart = pathParts.slice(i + 1);

		const arrSym = sc.inc();
		eqResults.push(arrSym);

		str += `const ${arrSym} = (Array.isArray(${firstPart.join("?.")})) && `;

		const docSym = "d";
		const safeLastPart = [docSym, ...lastPart].join("?.");

		str += `${firstPart.join(".")}.some((${docSym}) => `;

		if (ov == null) {
			str += `${safeLastPart}`;
		} else if (typeof ov === "object") {
			str += `JSON.stringify(${safeLastPart}) === ${JSON.stringify(JSON.stringify(ov))}`;
		} else {
			str += `${safeLastPart} === ${JSON.stringify(ov)}`;
		}

		str += `); `;
	}

	const pathSym = sc.inc();
	eqResults.push(pathSym);

	str += `const ${pathSym} = `;

	if (ov == null) {
		str += `${safePath}; `;
	} else if (typeof ov === "object") {
		str += `JSON.stringify(${safePath}) === ${JSON.stringify(JSON.stringify(ov))}; `;
	} else {
		str += `${safePath} === ${JSON.stringify(ov)}; `;
	}

	str += `let ${eqSym} = ${eqResults.join(" || ")}; `;

	if (mode === "nor") {
		str += `${eqSym} = !${eqSym}; `;
	}

	return str;
}
