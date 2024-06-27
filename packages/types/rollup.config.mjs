import dts from 'rollup-plugin-dts';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default [
  // Main build
  {
    input: './src/index.ts',
    output: {
      dir: 'dist',
      format: 'cjs',
      sourcemap: true
    },
    plugins: [
      resolve({
        preferBuiltins: true
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist/types'
      })
    ],
    external: ['mongoose', 'express', '@types/express']
  },
  // Generate type declarations
  {
    input: './src/index.ts',
    output: {
      dir: 'dist/types',
      format: 'es'
    },
    plugins: [
      dts({
        respectExternal: true
      })
    ],
    external: ['mongoose', 'express', '@types/express', 'crypto', 'http']
  }
];
