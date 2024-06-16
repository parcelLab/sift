import { Filter, Query, cmpOps } from "./types";
import { deepCompare } from "./utils";

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
const useStrictStr = '"use strict"; ';
const deepCompareStr = deepCompare.toString() + "; ";
const header = useStrictStr + deepCompareStr;

interface CompilerOptions {
	/** Debug mode, dumps the function string into console */
	debug?: boolean;
}

/**
 * Compiles a mongo filter query into a filter function
 */
export function compile(query: Query, options: CompilerOptions = {}): Filter {
	let str = header;

	const sc = new SymbolCounter();
	const results: string[] = [];

	for (const path in query) {
		const expOrOv = query[path];

		const pathParts = path.split(".");

		/** When there are non-ops it the entire ov is used as a deep strict equal match */
		const isAllOps =
			expOrOv &&
			typeof expOrOv === "object" &&
			Object.keys(expOrOv).every((k) => cmpOps.has(k));

		if (isAllOps) {
			if ("$eq" in expOrOv) {
				const ovs = JSON.stringify(expOrOv["$eq"]);
				str += genEq(sc, results, ovs, pathParts);
			}
		} else {
			const ovs = JSON.stringify(expOrOv);
			str += genEq(sc, results, ovs, pathParts);
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

function genEq(
	sc: SymbolCounter,
	results: string[],
	ovs: string,
	pathParts: string[],
) {
	let str = "";

	const eqSym = sc.inc();
	results.push(eqSym);

	const isOvNil = ovs === "null" || ovs === "undefined";

	if (!isOvNil) {
		const safePath = getSafePath([docSym, ...pathParts]);

		str +=
			`const ${eqSym} = ` +
			genShallowCompare(safePath, ovs) +
			` || ` +
			`deepCompare(${docSym}, ${JSON.stringify(pathParts)}, ${ovs}); `;
	} else {
		str += `const ${eqSym} = deepCompare(${docSym}, ${JSON.stringify(pathParts)}, ${ovs}); `;
	}

	return str;
}

function genShallowCompare(safePath: string, ovs: string) {
	if (ovs === "null" || ovs === "undefined") {
		return `${safePath}`;
	} else if (ovs[0] === "{" || ovs[0] === "[") {
		return `JSON.stringify(${safePath}) === ${JSON.stringify(ovs)}`;
	} else {
		return `${safePath} === ${ovs}`;
	}
}

function getSafePath(parts: string[]): string {
	let path = parts[0] ?? "";

	for (const part of parts.slice(1)) {
		path += `?.[${stringifyPart(part)}]`;
	}

	return path;
}

function stringifyPart(part: string): string | number {
	const n = parseInt(part);
	return isNaN(n) ? JSON.stringify(part) : n;
}
