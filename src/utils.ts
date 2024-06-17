import { OpValue } from "./types";

/**
 * Checks if a value is in an object's path.
 * Traverses object and arrays in the path.
 */
export function deepCompare(
	obj: any | any[],
	path: string[],
	ov: OpValue,
): boolean {
	if (path.length === 0) {
		if (Array.isArray(obj) && obj.some((o) => deepCompare(o, path, ov))) {
			return true;
		}

		if (obj == null && ov == null) {
			return true;
		}

		if (typeof obj == "object") {
			return JSON.stringify(obj) === JSON.stringify(ov);
		}

		return obj === ov;
	}

	const key = path[0]!;
	const rest = path.slice(1);

	if (obj == null) {
		return ov == null;
	}

	if (typeof obj !== "object") {
		return ov == null;
	}

	if (key in obj) {
		return deepCompare(obj[key], rest, ov);
	}

	if (Array.isArray(obj)) {
		return obj.some((o) => deepCompare(o, path, ov));
	}

	return ov == null;
}
