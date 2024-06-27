import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
  // Client build
  {
    input: 'src/client/index.ts',
    output: {
      dir: 'dist/client',
      format: 'esm',
      sourcemap: true
    },
    plugins: [
      resolve({
        browser: true
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.client.json', // Use a client-specific tsconfig
        declaration: true,
        declarationDir: 'dist/client/types', // Place declaration files in the correct directory
        rootDir: 'src/client'
      })
    ],
    external: ['@apollo/client', 'graphql']
  },
  // Server build
  {
    input: 'src/server/index.ts',
    output: {
      dir: 'dist/server',
      format: 'cjs',
      sourcemap: true
    },
    plugins: [
      resolve({
        preferBuiltins: true
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.server.json', // Use a server-specific tsconfig
        declaration: true,
        declarationDir: 'dist/server/types', // Place declaration files in the correct directory
        rootDir: 'src/server'
      })
    ],
    external: ['@apollo/server', 'graphql']
  },
  // Generate type declarations for client
  {
    input: 'dist/client/types/index.d.ts',
    output: {
      file: 'dist/client/index.d.ts',
      format: 'esm'
    },
    plugins: [dts()]
  },
  // Generate type declarations for server
  {
    input: 'dist/server/types/index.d.ts',
    output: {
      file: 'dist/server/index.d.ts',
      format: 'cjs'
    },
    plugins: [dts()]
  }
];
