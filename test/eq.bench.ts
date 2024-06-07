import { describe, bench } from "vitest";

import { compile } from "../src/compiler";

import sift from "sift";

describe("simple $eq", () => {
	bench("sift", () => {
		const query = {
			foo: "baz",
		};

		const input = [{}, { foo: "bar" }, { foo: "baz" }];

		const filter = sift(query);

		input.filter(filter);
	});

	bench("compiled", () => {
		const query = {
			foo: "baz",
		};

		const input = [{}, { foo: "bar" }, { foo: "baz" }];

		const filter = compile(query);

		input.filter(filter);
	});
});
