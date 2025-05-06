import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';
import {defineConfig} from 'rollup';

export default defineConfig([
    // Main library bundle
    {
        input: 'src/index.ts',
        output: [
            {
                file: 'dist/index.js',
                format: 'cjs',
                sourcemap: true,
            },
            {
                file: 'dist/index.esm.js',
                format: 'es',
                sourcemap: true,
            },
        ],
        external: ['ts-morph', 'prettier', 'path', 'fs/promises', 'commander'],
        plugins: [
            resolve(),
            commonjs(),
            typescript({tsconfig: './tsconfig.json'}),
        ],
    },
    // CLI bundle
    {
        input: 'src/cli/cli.ts',
        output: {
            file: 'dist/bin/cli.js',
            format: 'cjs',
            banner: '#!/usr/bin/env node',
            sourcemap: true,
        },
        external: [
            'ts-morph',
            'prettier',
            'path',
            'fs/promises',
            'commander',
            '../index',
        ],
        plugins: [
            resolve(),
            commonjs(),
            typescript({tsconfig: './tsconfig.json'}),
        ],
    },
    // Type definitions
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/index.d.ts',
            format: 'es',
        },
        plugins: [dts()],
    },
]);
