import { OpValue } from "./types";

/**
 * Checks if a value is in an object's path.
 * Traverses object and arrays in the path.
 */
export function deepCompare(
	obj: any | any[],
	path: string[],
	value: OpValue,
): boolean {
	if (path.length === 0) {
		if (Array.isArray(obj) && obj.some((o) => deepCompare(o, [], value))) {
			return true;
		}

		if (obj == null && value == null) {
			return true;
		}

		if (typeof obj == "object") {
			return JSON.stringify(obj) === JSON.stringify(value);
		}

		return obj === value;
	}

	const key = path[0]!;
	const rest = path.slice(1);

	if (obj == null) {
		return value == null;
	}

	if (typeof obj !== "object") {
		return value == null;
	}

	if (key in obj) {
		return deepCompare(obj[key], rest, value);
	}

	if (Array.isArray(obj)) {
		return obj.some((o) => deepCompare(o, path, value));
	}

	return deepCompare(obj[key], [], value);
}
