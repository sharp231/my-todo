import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        setupFiles: ['./src/__tests__/setup.js'],
        exclude: [
            ...configDefaults.exclude,
            '**/*.integration.test.js',
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'src/__tests__/',
            ],
        },
    },
}); 