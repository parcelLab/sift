import { randomInt } from "crypto";
import { createHistogram } from "perf_hooks";
import sift from "sift";
import { compile } from "../src/compiler";
import { TestCase } from "../src/types";

type BenchCase = Pick<TestCase, "name" | "query" | "input" | "siftDiff">;

const RUNS_PER_CASE = 10_000;

const cases: BenchCase[] = [
	{
		name: "explicit $eq",
		query: { foo: { $eq: "bar" } },
		input: [{ foo: "bar" }, {}, { foo: "baz" }, { foo: { foo: "bar" } }],
	},
	{
		name: "implicit $eq",
		query: { foo: "bar" },
		input: [{ foo: "bar" }, {}, { foo: "baz" }, { foo: { foo: "bar" } }],
	},
	{
		name: "implicit $eq, full object match",
		query: { foo: { bar: 1, $size: 2 } },
		input: [
			{ foo: "bar" },
			{},
			{ foo: [{ bar: 1 }, { bar: 2 }] },
			{ foo: { bar: 1, $size: 2 } },
		],
		siftDiff: true,
	},
	{
		name: "explicit $eq, full object match",
		query: { foo: { $eq: { bar: 1, $size: 2 } } },
		input: [
			{ foo: "bar" },
			{},
			{ foo: [{ bar: 1 }, { bar: 2 }] },
			{ foo: { bar: 1, $size: 2 } },
		],
	},
	{
		name: "nested object path, explicit $eq",
		query: { "foo.bar": { $eq: "baz" } },
		input: [
			{ foo: { bar: "baz" } },
			{},
			{ foo: "bar" },
			{ foo: { bar: "qux" } },
		],
	},
	{
		name: "nested object path, implicit $eq",
		query: { "foo.bar": "baz" },
		input: [
			{ foo: { bar: "baz" } },
			{},
			{ foo: "bar" },
			{ foo: { bar: "qux" } },
		],
	},
	{
		name: "nested object path, full object match",
		query: { "foo.bar": { baz: "qux", $eq: "bar" } },
		input: [
			{ foo: { bar: { baz: "qux", $eq: "bar" } } },
			{ foo: { bar: { baz: "qux", bla: "jaz" } } },
			{},
			{ foo: "bar" },
			{ foo: { bar: "baz" } },
		],
		siftDiff: true,
	},
	{
		name: "nested object path, full object match",
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
		name: "implicit $eq, object against null",
		query: { "foo.bar": null },
		input: [
			{ foo: { bar: null } },
			{ foo: { bar: "baz" } },
			{ foo: null },
			{ foo: "bar" },
			{},
		],
	},
	{
		name: "explicit $eq, object against null",
		query: { "foo.bar": { $eq: null } },
		input: [
			{ foo: { bar: null } },
			{ foo: { bar: "baz" } },
			{ foo: null },
			{ foo: "bar" },
			{},
		],
	},
	{
		name: "match against arrays on ov",
		query: { "foo.bar": ["baz"] },
		input: [
			{ foo: { bar: "baz" } },
			{ foo: { bar: ["baz"] } },
			{ foo: { bar: [["baz"]] } },
			{ foo: { bar: ["baz", "bar"] } },
			{},
			{ foo: "bar" },
			{ foo: [{ bar: "qux" }] },
		],
	},
	{
		name: "match against arrays on doc",
		query: { "foo.bar": "baz" },
		input: [
			{ foo: { bar: ["bar"] } },
			{ foo: { bar: ["baz", "bar"] } },
			{},
			{ foo: "bar" },
			{ foo: [{ bar: "qux" }] },
		],
	},
	{
		name: "unindexed nested object path with intermediate arrays on doc",
		query: { "foo.bar": "baz" },
		input: [
			{ foo: [{ bar: "baz" }] },
			{},
			{ foo: "bar" },
			{ foo: [{ bar: "qux" }] },
		],
	},
	{
		name: "unindexed nested object path against null",
		query: { "foo.bar": null },
		input: [
			{ foo: [{ bar: "baz" }] },
			{},
			{ foo: "bar" },
			{ foo: { bar: null } },
			{ foo: [{ bar: "qux" }] },
		],
	},
	{
		name: "indexed nested object path with intermediate arrays on doc",
		query: { "foo.1.bar": "baz" },
		input: [
			{ foo: [{}, { bar: "baz" }] },
			{ foo: [{ bar: "baz" }, {}] },
			{},
			{ foo: "bar" },
			{ foo: [{ bar: "qux" }] },
		],
	},
	{
		name: "nested arrays on doc",
		query: { "foo.bar.baz": "qux" },
		input: [
			{ foo: [{ bar: [{ baz: "qux" }] }] },
			{},
			{ foo: "bar" },
			{ foo: [{ bar: "baz" }] },
		],
	},
];

runBench(cases);

/**
 * Runs benchmarks in random order
 */
function runBench(cases: BenchCase[]) {
	const benchmarkCases = cases
		.filter((c) => !c.siftDiff)
		.flatMap((c) => {
			const siftHistogram = createHistogram();
			const compiledHistogram = createHistogram();

			const runSift = performance.timerify(
				() => c.input.filter(sift(c.query)),
				{
					histogram: siftHistogram,
				},
			);

			const runCompiled = performance.timerify(
				() => c.input.filter(compile(c.query)),
				{
					histogram: compiledHistogram,
				},
			);

			return [
				{
					name: c.name,
					version: "sift",
					histogram: siftHistogram,
					run: runSift,
				},
				{
					name: c.name,
					version: "compiled",
					histogram: compiledHistogram,
					run: runCompiled,
				},
			];
		});

	const totalRuns = benchmarkCases.length * RUNS_PER_CASE;

	for (let i = 0; i < totalRuns; i++) {
		let next = sample(benchmarkCases)!;

		while (next.histogram.count >= RUNS_PER_CASE) {
			next = sample(benchmarkCases)!;
		}

		next.run();
	}

	console.log("Benchmark results:");

	for (let i = 0; i < benchmarkCases.length; i += 2) {
		const sift = benchmarkCases[i]!;
		const compiled = benchmarkCases[i + 1]!;

		const { name, histogram: siftHistogram } = sift;
		const { histogram: compiledHistogram } = compiled;

		const siftMean = siftHistogram.mean;
		const compiledMean = compiledHistogram.mean;

		const faster = siftMean < compiledMean ? "sift" : "compiled";
		const fasterBy =
			faster === "sift" ? compiledMean / siftMean : siftMean / compiledMean;

		console.log(`${name}: ${faster} was faster by ${fasterBy}x`);
		console.group();
		console.log(
			`n:   sift=${siftHistogram.count}, compiled=${compiledHistogram.count}`,
		);
		console.log(
			`m:   sift=${siftMean.toFixed(0)}ns, compiled=${compiledMean.toFixed(0)}ns`,
		);
		console.log(
			`sd:  sift=${siftHistogram.stddev.toFixed(0)}ns, compiled=${compiledHistogram.stddev.toFixed(0)}ns`,
		);
		console.log(
			`p50: sift=${siftHistogram.percentile(50)}ns, compiled=${compiledHistogram.percentile(50)}ns`,
		);
		console.log(
			`p95: sift=${siftHistogram.percentile(95)}ns, compiled=${compiledHistogram.percentile(95)}ns`,
		);
		console.log(
			`p99: sift=${siftHistogram.percentile(99)}ns, compiled=${compiledHistogram.percentile(99)}ns`,
		);
		console.groupEnd();
		console.log();
	}
}

function sample<T = unknown>(array: T[]): T | undefined {
	return array.length ? array[randomInt(array.length)] : undefined;
}
