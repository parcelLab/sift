/**
 * From a list of path in a string,
 * generate all possible safe paths,
 * and deals with numeric indices.
 * @example doc.foo.bar becomes doc?.["foo"]?.["bar"]
 * @example doc.foo.0.bar becomes doc?.["foo"]?.[0]?.["bar"]
 */
export function genSafePaths(path: string): string {
	const parts = path.split(".");
	let result = parts[0] ? parts[0] : "";

	for (let i = 1; i < parts.length; i++) {
		const part = parts[i];

		if (isNaN(parseInt(part, 10))) {
			result += `?.["${part}"]`;
		} else {
			result += `?.[${part}]`;
		}
	}

	return result;
}
