// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.eslint.json', './tsconfig.json', './packages/*/tsconfig.json'],
        tsconfigRootDir: import.meta.dirname
      }
    },
    ignores: ['**/.prettierrc.js', '/packages/**/dist/']
  }
);
