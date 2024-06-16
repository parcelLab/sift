import { Filter, Query, cmpOps } from "./types";

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
const kDoc = "doc";

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

		const pathParts = path.split(".");

		/** When there are non-ops it the entire ov is used as a deep strict equal match */
		const isAllOps =
			expOrOv &&
			typeof expOrOv === "object" &&
			Object.keys(expOrOv).every((k) => cmpOps.has(k));

		if (isAllOps) {
			if ("$eq" in expOrOv) {
				const ovs = JSON.stringify(expOrOv["$eq"]);
				if (options.debug) {
					str += `\n/* START ${path} $eq ${ovs} */\n`;
				}
				const kRet = sc.inc();
				results.push(kRet);
				str += genEq(kRet, ovs, pathParts, options);
				if (options.debug) {
					str += `\n/* END $eq ${path} ${ovs} */\n`;
				}
			}
		} else {
			const ovs = JSON.stringify(expOrOv);
			if (options.debug) {
				str += `\n/* START ${path} $eq ${ovs} */\n`;
			}
			const kRet = sc.inc();
			results.push(kRet);
			str += genEq(kRet, ovs, pathParts, options);
			if (options.debug) {
				str += `\n/* END ${path} $eq ${ovs} */\n`;
			}
		}
	}

	const kRet = sc.inc();

	if (options.debug) {
		str += "\n/* return */\n";
	}

	if (results.length > 0) {
		str += `const ${kRet} = ${results.join(" && ")}; `;
	} else {
		str += `const ${kRet} = true; `;
	}

	str += `return ${kRet}`;

	try {
		const fn = new Function(kDoc, str) as Filter;
		if (options.debug) {
			console.log(fn.toString());
		}
		return fn;
	} catch (error) {
		console.error(error);
		if (options.debug) {
			console.error(str);
		}
		throw error;
	}
}

class SymbolCounter {
	constructor(
		private count: number = 0,
		private prefix: string = "s",
	) {}

	inc() {
		this.count++;
		return `${this.prefix}_${this.count}`;
	}
}

type Mode = "and" | "or" | "nor";

function genEq(
	kRet: string,
	ovs: string,
	pathParts: string[],
	options: CompilerOptions,
) {
	let str = "";
	let sc = new SymbolCounter(0, kRet);
	if (options.debug) {
		str += `\n/* START kRet:${kRet} pathParts:[${pathParts.join(",")}] */\n`;
	}

	const mode: Mode = ovs === "null" || ovs === "undefined" ? "nor" : "or";
	const results = [];

	const safePath = getSafePath(kDoc, pathParts);
	results.push(kRet);
	str += `let ${kRet} = ` + genCompareOv(safePath, ovs);

	for (let i = 0; i < pathParts.length; i++) {
		const head = pathParts.slice(0, i + 1);
		const tail = pathParts.slice(i + 1);
		const safeHeadPath = getSafePath(kDoc, head);
		const safeTailPath = getSafePath(kDoc, tail);

		const kArrRet = sc.inc();
		results.push(kArrRet);
		str += `const ${kArrRet} = (Array.isArray(${safeHeadPath})) && ${safeHeadPath}.some((${kDoc}) => {`;
		if (!tail.length) {
			str += `return ${genCompareOv(kDoc, ovs)}; `;
		} else {
			const subArrResults: string[] = [];

			const kSubPathCmp = sc.inc();
			subArrResults.push(kSubPathCmp);
			str += `let ${kSubPathCmp} = ` + genCompareOv(safeTailPath, ovs);

			if (tail.length) {
				const kSubArrRet = sc.inc();
				subArrResults.push(kSubArrRet);
				str += genEq(kSubArrRet, ovs, tail, options);
			}

			const kSubArrResult = sc.inc();
			str += `let ${kSubArrResult} = ${subArrResults.join(" || ")}; `;
			str += `return ${kSubArrResult}; `;
		}

		str += `}); `;
	}

	str += `${kRet} = ${mode === "nor" ? "!" : ""}(${results.join(" || ")}); `;

	if (options.debug) {
		str += `\n/* END kRet:${kRet} pathParts:[${pathParts.join(",")}] */\n`;
	}

	return str;
}

function genCompareOv(safePath: string, ovs: string) {
	if (ovs === "null" || ovs === "undefined") {
		return `${safePath}; `;
	} else if (ovs[0] === "{" || ovs[0] === "[") {
		return `JSON.stringify(${safePath}) === ${JSON.stringify(ovs)}; `;
	} else {
		return `${safePath} === ${ovs}; `;
	}
}

function getSafePath(kDoc: string, parts: string[]): string {
	let path = kDoc;

	for (const part of parts) {
		path += isNaN(parseInt(part)) ? `?.${part}` : `?.[${part}]`;
	}

	return path;
}
