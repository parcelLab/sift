import { expect, test } from "vitest";

import { add } from "../build/debug.js";

test("wasm import and runs", () => {
	expect(add(1, 2)).toEqual(3);
});
