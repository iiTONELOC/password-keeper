import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default [
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
        tsconfig: './tsconfig.json'
      })
    ],
    external: ['mongoose']
  }
];
