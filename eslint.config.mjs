import js from '@eslint/js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load plugins
const tsParser = await import('@typescript-eslint/parser');
const tsPlugin = await import('@typescript-eslint/eslint-plugin');
const reactPlugin = await import('eslint-plugin-react');
const reactHooksPlugin = await import('eslint-plugin-react-hooks');
const nextPlugin = await import('@next/eslint-plugin-next');

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
	// Ignore build outputs
	{
		ignores: ['.next/**', 'node_modules/**', 'dist/**', 'out/**', 'build/**'],
	},

	// Base configuration
	{
		files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
		...js.configs.recommended,
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				// Browser & Node.js essentials
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
				NodeJS: 'readonly',
			},
		},
		rules: {
			// Critical errors only
			'no-console': 'error',
			'no-debugger': 'error',
			'no-var': 'error',
			'prefer-const': 'error',
			eqeqeq: ['error', 'always'],
			'no-unreachable': 'error',
			'no-unused-vars': 'off', // Let TypeScript handle this
		},
	},

	// TypeScript configuration
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
			'no-undef': 'off', // TypeScript handles this
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
			],
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/await-thenable': 'error',
		},
	},

	// React configuration
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

	// Next.js configuration
	{
		files: ['**/*.{js,jsx,ts,tsx}'],
		plugins: {
			'@next/next': nextPlugin.default,
		},
		rules: {
			'@next/next/no-html-link-for-pages': 'error',
			'@next/next/no-img-element': 'warn',
			'@next/next/no-sync-scripts': 'error',
		},
	},

	// Relax rules for config files
	{
		files: ['*.config.{js,mjs,ts}'],
		rules: {
			'no-console': 'off',
		},
	},
];

export default eslintConfig;
