import { bench, describe } from "vitest";
import { compile } from "../src/compiler";
import sift from "sift";

describe("simple $eq", () => {
	const query = { foo: "baz" };
	const input = [{}, { foo: "bar" }, { foo: "baz" }];

	bench("sift", () => {
		const filter = sift(query);
		input.filter(filter);
	});

	bench("compiled", () => {
		const filter = compile(query);
		input.filter(filter);
	});
});

describe("nested path $eq", () => {
	const query = { "foo.bar": "baz" };
	const input = [{}, { foo: "bar" }, { foo: "baz" }];

	bench("sift", () => {
		const filter = sift(query);
		input.filter(filter);
	});

	bench("compiled", () => {
		const filter = compile(query);
		input.filter(filter);
	});
});
