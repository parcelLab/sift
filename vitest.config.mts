import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globalSetup: ["./test/mongo-setup.ts"],
		coverage: {
			reporter: "lcov",
			include: ["src/*.ts"],
		},
	},
});
