// The entry file of your WebAssembly module.

export function add(a: i32, b: i32): i32 {
	return a + b;
}

class GenEqReturnType {
	str: string;
	sc: i32;
	results: string[];
}

export function genEq(
	sc: i32,
	results: string[],
	/** OpValue serialized */
	ovs: string,
	pathParts: string[],
): GenEqReturnType {
	let str = "";

	sc++;
	const eqSym = `s_${sc}`;
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
		sc++;
		const arrSym = `s_${sc}`;
		eqResults.push(arrSym);

		str += `const ${arrSym} = (Array.isArray(${safeFirstPart})) && ${safeFirstPart}.some((${docSym}) => {`;

		const subArrResults: string[] = [];
		sc++;
		const subArrSym = `s_${sc}`;
		subArrResults.push(subArrSym);

		str += `const ${subArrSym} = `;
		str += genCompareOv(safePath, ovs);
		const res = genEq(sc, subArrResults, ovs, lastParts);
		sc = res.sc;
		str += res.str;

		sc++;
		const subArrResultSym = `s_${sc}`;
		str += `let ${subArrResultSym} = ${subArrResults.join(" || ")}; `;
		str += `return ${subArrResultSym}; }); `;
	}

	const safePath = getSafePath(pathParts);
	sc++;
	const pathSym = `s_${sc}`;
	eqResults.push(pathSym);

	str += `const ${pathSym} = `;
	str += genCompareOv(safePath, ovs);
	str += `let ${eqSym} = ${eqResults.join(" || ")}; `;

	if (mode === "nor") {
		str += `${eqSym} = !${eqSym}; `;
	}

	return { str, sc, results };
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

		if (isNaN(parseInt(part, 10))) {
			path += `?.["${part}"]`;
		} else {
			path += `?.[${part}]`;
		}
	}

	return path;
}
