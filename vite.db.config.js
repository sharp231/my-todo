import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        include: [
            'src/__tests__/**/*.integration.test.js',
        ],
        globalSetup: [
            './src/__tests__/db-global-setup.js',
        ],
        fileParallelism: false,
        maxWorkers: 1,
    },
});