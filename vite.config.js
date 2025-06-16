import { defineConfig } from 'vite';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        setupFiles: ['./src/__tests__/setup.js'],
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