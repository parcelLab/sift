import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globalSetup: ["./test/mongo-setup.ts"],
		typecheck: {
			enabled: true,
		},
		benchmark: {
			outputJson: "test/bench.json",
		},
	},
});
