import { BenchOptions, bench, describe } from "vitest";
import { compile } from "../src/compiler";
import sift from "sift";

const benchmarkScenarios: BenchOptions[] = [
	{ time: 10, warmupTime: 10 },
	{ time: 1000, warmupTime: 1000 },
];

const applySift = (query: any, input: any[]) => {
	const filter = sift(query);
	input.filter(filter);
};

const applyCompiled = (query: any, input: any[]) => {
	const filter = compile(query);
	input.filter(filter);
};

const benchmarkCases = [
	{
		name: "simple $eq",
		query: { foo: "baz" },
		input: [{}, { foo: "bar" }, { foo: "baz" }],
	},
	{
		name: "nested path $eq",
		query: { "foo.bar": "baz" },
		input: [{}, { foo: "bar" }, { foo: "baz" }],
	},
	{
		name: "full object match",
		query: { "foo.bar": { baz: "qux" } },
		input: [
			{ foo: { bar: { baz: "qux" } } },
			{ foo: { bar: { baz: "qux", bla: "jaz" } } },
			{},
			{ foo: "bar" },
			{ foo: { bar: "baz" } },
		],
	},
	{
		name: "null match",
		query: { "foo.bar": null },
		input: [
			{ foo: { bar: null } },
			{ foo: { bar: "baz" } },
			{ foo: null },
			{ foo: "bar" },
			{},
		],
	},
];

describe.each(benchmarkScenarios)("benchmark $time ms", (options) => {
	describe.each(benchmarkCases)("$name", ({ query, input }) => {
		bench("sift", () => applySift(query, input), options);
		bench("compiled", () => applyCompiled(query, input), options);
	});
});
