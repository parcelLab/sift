import { genSafePaths as gspWasm } from "../build/release.js";
import { genSafePaths as gspJs } from "../assembly/string.js";
import { bench } from "vitest";

bench("gspWasm", () => {
	gspWasm("doc.foo.bar");
});

bench("gspJs", () => {
	gspJs("doc.foo.bar");
});
