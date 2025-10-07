const typescript = require('@rollup/plugin-typescript');
const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const { dts } = require('rollup-plugin-dts');

module.exports = [
  // Main build
  {
    input: 'packages/react/src/index.ts',
    output: [
      {
        file: 'packages/react/dist/index.js',
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: 'packages/react/dist/index.esm.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: 'packages/react/tsconfig.json',
        declaration: false,
      }),
    ],
    external: ['react', 'react-dom', '@storymark/core'],
  },
  // Type definitions
  {
    input: 'packages/react/src/index.ts',
    output: {
      file: 'packages/react/dist/index.d.ts',
      format: 'esm',
    },
    plugins: [dts()],
  },
];
