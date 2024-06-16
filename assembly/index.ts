// The entry file of your WebAssembly module.

export function add(a: i32, b: i32): i32 {
	return a + b;
}

export function genEq(ns: string, ovs: string, pathParts: string[]): string {
	let str = "";

	let sc = 0;

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
		const arrSym = `${ns}_${sc}`;
		eqResults.push(arrSym);

		str += `const ${arrSym} = (Array.isArray(${safeFirstPart})) && ${safeFirstPart}.some((${docSym}) => { `;

		{
			const subArrResults: string[] = [];

			sc++;
			const subArrSym = `${ns}_${sc}`;
			subArrResults.push(subArrSym);

			str += `const ${subArrSym} = ` + genCompareOv(safePath, ovs);

			sc++;
			const subNs = `${ns}_${sc}`;
			str += genEq(subNs, ovs, lastParts);
			subArrResults.push(subNs);

			sc++;
			const subArrResultSym = `${ns}_${sc}`;
			str += `let ${subArrResultSym} = ${subArrResults.join(" || ")}; `;
			str += `return ${subArrResultSym}; `;
		}

		str += `}); `;
	}

	const safePath = getSafePath(pathParts);
	sc++;
	const pathSym = `${ns}_${sc}`;
	eqResults.push(pathSym);

	str += `const ${pathSym} = ` + genCompareOv(safePath, ovs);
	str += `let ${ns} = ${eqResults.join(" || ")}; `;

	if (mode === "nor") {
		str += `${ns} = !${ns}; `;
	}

	return str;
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

export { genSafePaths } from "./string";
