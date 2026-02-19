import { defineConfig } from 'vitest/config';
import path from 'path';
import pkg from './package.json';

export default defineConfig({
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/__tests__/setup.ts'],
        include: ['src/__tests__/**/*.test.ts', 'src/__tests__/**/*.test.tsx'],
    },
});
