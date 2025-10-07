const typescript = require('@rollup/plugin-typescript');
const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const { dts } = require('rollup-plugin-dts');

module.exports = [
  // Main build
  {
    input: 'packages/core/src/index.ts',
    output: [
      {
        file: 'packages/core/dist/index.js',
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: 'packages/core/dist/index.esm.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: 'packages/core/tsconfig.json',
        declaration: false,
      }),
    ],
    external: ['yaml'],
  },
  // Type definitions
  {
    input: 'packages/core/src/index.ts',
    output: {
      file: 'packages/core/dist/index.d.ts',
      format: 'esm',
    },
    plugins: [dts()],
  },
];
