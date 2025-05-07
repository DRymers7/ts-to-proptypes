import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import {dts} from 'rollup-plugin-dts';
import { defineConfig } from 'rollup';

const EXTERNAL_RUNTIME = [
  'ts-morph',
  'prettier',
  'path',
  'fs/promises',
  'commander'
];

export default defineConfig([
  // -----------------------
  // Main library bundle
  // -----------------------
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
    external: EXTERNAL_RUNTIME,
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        outputToFilesystem: true,
        // disable declaration emit here
        declaration: false,
        declarationMap: false,
      }),
    ],
  },

  // -----------------------
  // CLI executable bundle
  // -----------------------
  {
    input: 'src/cli/cli.ts',
    output: {
      file: 'dist/bin/cli.js',
      format: 'cjs',
      banner: '#!/usr/bin/env node',
      sourcemap: true,
    },
    external: [
      ...EXTERNAL_RUNTIME,
      // avoid bundling our library entrypoint import
      '../index'
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        outputToFilesystem: true,
        declaration: false,
        declarationMap: false,
      }),
    ],
  },

  // -----------------------
  // Declaration bundle
  // -----------------------
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    external: EXTERNAL_RUNTIME,
    plugins: [
      dts(),
    ],
  },
]);