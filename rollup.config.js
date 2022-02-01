'use strict';

import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import banner2 from 'rollup-plugin-banner2';
import { terser } from 'rollup-plugin-terser';

import packageJson from './package.json';

const version = packageJson.version;

/** @type {import("rollup").RollupOptions} */
export default {
	input: 'src/index.ts',
	output: {
		file: 'dist/bcmdk.js',
		format: 'iife',
	},
	treeshake: false,
	plugins: [
		resolve({ browser: true }),
		typescript({ tsconfig: './tsconfig.json' }),
		terser(),
		banner2(() =>
			`// Bondage Club Mod Development Kit (${version})\n` +
			'// For more info see: https://github.com/Jomshir98/bondage-club-mod-sdk\n',
		),
	],
	onwarn(warning, warn) {
		switch (warning.code) {
			case 'EVAL':
			case 'CIRCULAR_DEPENDENCY':
				return;
			default:
				warn(warning);
		}
	},
};
