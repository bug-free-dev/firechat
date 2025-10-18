import path from 'node:path';
import { fileURLToPath } from 'node:url';

import js from '@eslint/js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tsParser = await import('@typescript-eslint/parser');
const tsPlugin = await import('@typescript-eslint/eslint-plugin');
const reactPlugin = await import('eslint-plugin-react');
const reactHooksPlugin = await import('eslint-plugin-react-hooks');
const nextPlugin = await import('@next/eslint-plugin-next');
const simpleImportSort = await import('eslint-plugin-simple-import-sort');
const unusedImports = await import('eslint-plugin-unused-imports');
const jsxA11y = await import('eslint-plugin-jsx-a11y');

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
	// 1) Ignore build outputs
	{
		ignores: ['.next/**', 'node_modules/**', 'dist/**', 'out/**', 'build/**'],
	},

	// 2) Base config for JS/JSX/TS/TSX
	{
		files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
		...js.configs.recommended,
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				window: 'readonly',
				document: 'readonly',
				console: 'readonly',
				setTimeout: 'readonly',
				setInterval: 'readonly',
				clearTimeout: 'readonly',
				clearInterval: 'readonly',
				fetch: 'readonly',
				localStorage: 'readonly',
				sessionStorage: 'readonly',
				process: 'readonly',
				Buffer: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
			},
		},
		// register helpful plugins in the base block (parser-less plugins)
		plugins: {
			'simple-import-sort': simpleImportSort.default,
			'unused-imports': unusedImports.default,
			'jsx-a11y': jsxA11y.default,
		},
		rules: {
			// Keep your critical rules (from original file)
			'no-console': 'error',
			'no-debugger': 'error',
			'no-var': 'error',
			'prefer-const': 'error',
			eqeqeq: ['error', 'always'],
			'no-unreachable': 'error',
			// Let TypeScript handle unused vars for TS files
			'no-unused-vars': 'off',

			// import sorting & cleanup (helpful, non-invasive)
			'simple-import-sort/imports': 'warn',
			'simple-import-sort/exports': 'warn',
			'unused-imports/no-unused-imports': 'warn',
			'unused-imports/no-unused-vars': [
				'warn',
				{ vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
			],

			// light a11y nudges
			'jsx-a11y/anchor-is-valid': 'warn',
		},
	},

	// 3) TypeScript-specific rules & parser (keeps strictness)
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			parser: tsParser.default,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				ecmaFeatures: { jsx: true },
				project: './tsconfig.json',
				tsconfigRootDir: __dirname,
			},
		},
		plugins: {
			'@typescript-eslint': tsPlugin.default,
		},
		rules: {
			'no-undef': 'off', // TS already enforces this
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
			],
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/await-thenable': 'error',
		},
	},

	// 4) React + hooks
	{
		files: ['**/*.{jsx,tsx}'],
		plugins: {
			react: reactPlugin.default,
			'react-hooks': reactHooksPlugin.default,
		},
		settings: {
			react: { version: 'detect' },
		},
		rules: {
			'react/react-in-jsx-scope': 'off',
			'react/prop-types': 'off',
			'react/jsx-key': 'error',
			'react/jsx-no-target-blank': 'error',
			'react/no-unstable-nested-components': 'error',
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
		},
	},

	// 5) Next.js plugin integration (official). Keep important Next rules, disable no-img-element.
	{
		files: ['**/*.{js,jsx,ts,tsx}'],
		plugins: {
			'@next/next': nextPlugin.default,
		},
		rules: {
			// disable warnings for using <img> (explicit per request)
			'@next/next/no-img-element': 'off',

			// Keep other Next.js best-practice rules enabled (can be tuned later)
			'@next/next/no-sync-scripts': 'error',
			'@next/next/no-html-link-for-pages': 'error',
			// other Next rules are left at plugin defaults — you can override here if needed
		},
	},

	// 6) Relax rules for config files (allow console)
	{
		files: ['*.config.{js,mjs,ts}'],
		rules: {
			'no-console': 'off',
		},
	},
];
export default eslintConfig;
