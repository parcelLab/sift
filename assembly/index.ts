// The entry file of your WebAssembly module.

export function add(a: i32, b: i32): i32 {
	return a + b;
}

export function genEq(
	sc: SymbolCounter,
	results: string[],
	/** OpValue serialized */
	ovs: string,
	pathParts: string[],
): string {
	let str = "";

	const eqSym = sc.inc();
	results.push(eqSym);

	// "and" | "or" | "nor"
	const mode = ovs === "null" || ovs === "undefined" ? "nor" : "or";
	const eqResults: string[] = [];

	for (let i = 1; i < pathParts.length; i++) {
		const firstPart = pathParts.slice(0, i + 1);
		const lastPart = pathParts.slice(i + 1);
		const docSym = "d";
		const safeFirstPart = getSafePath(firstPart);
		const lastParts = [docSym].concat(lastPart);
		const safePath = getSafePath(lastParts);
		const arrSym = sc.inc();
		eqResults.push(arrSym);

		str += `const ${arrSym} = (Array.isArray(${safeFirstPart})) && ${safeFirstPart}.some((${docSym}) => {`;

		const subArrResults: string[] = [];
		const subArrSym = sc.inc();
		subArrResults.push(subArrSym);

		str += `const ${subArrSym} = `;
		str += genCompareOv(safePath, ovs);
		str += genEq(sc, subArrResults, ovs, lastParts);

		const subArrResultSym = sc.inc();
		str += `let ${subArrResultSym} = ${subArrResults.join(" || ")}; `;
		str += `return ${subArrResultSym}; }); `;
	}

	const safePath = getSafePath(pathParts);
	const pathSym = sc.inc();
	eqResults.push(pathSym);

	str += `const ${pathSym} = `;
	str += genCompareOv(safePath, ovs);
	str += `let ${eqSym} = ${eqResults.join(" || ")}; `;

	if (mode === "nor") {
		str += `${eqSym} = !${eqSym}; `;
	}

	return str;
}

class SymbolCounter {
	constructor(
		private count: number = 0,
		private prefix: string = "s_",
	) {}

	inc(): string {
		this.count++;
		return `${this.prefix}${this.count}`;
	}
}

function genCompareOv(safePath: string, ovs: string): string {
	let str = "";
	if (ovs === "null" || ovs === "undefined") {
		str += `${safePath}; `;
	} else if (ovs.at(0) === "{" || ovs.at(0) === "[") {
		str += `JSON.stringify(${safePath}) === JSON.stringify(${ovs}); `;
	} else {
		str += `${safePath} === ${ovs}; `;
	}
	return str;
}

function getSafePath(parts: string[]): string {
	let path = parts[0] ? parts[0] : "";

	const body = parts.slice(1);

	for (let i = 0; i < body.length; i++) {
		const part = body[i];

		if (isInteger(part)) {
			path += `?.[${part}]`;
		} else {
			path += `?.${part}`;
		}
	}

	return path;
}
