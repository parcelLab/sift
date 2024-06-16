import { expect, test } from "vitest";
import { genSafePaths as gspWasm } from "../build/release.js";
import { genSafePaths as gspJs } from "../assembly/string.js";

test("genSafePaths", () => {
	expect(gspWasm("doc.foo.bar")).toBe('doc?.["foo"]?.["bar"]');
	expect(gspWasm("doc.foo.0.bar")).toBe('doc?.["foo"]?.[0]?.["bar"]');

	expect(gspJs("doc.foo.bar")).toBe('doc?.["foo"]?.["bar"]');
	expect(gspJs("doc.foo.0.bar")).toBe('doc?.["foo"]?.[0]?.["bar"]');
});
