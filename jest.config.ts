import type { Config } from 'jest';

const config: Config = {
	preset: 'jest-preset-angular',
	moduleNameMapper: {
		/**
		 * Bypass icon registration error that occurs in JEST
		 *
		 * In CCA, we import icons from `es` directory... which is bundled as EcmaScript Modules (esm).
		 * Jest has experimental support for `esm` as of now. Hence we need to bypass this error
		 * by pointing to the common js equivalent.
		 *
		 */
		"^@carbon/icons/es/(.*)$": "@carbon/icons/lib/$1.js",
		// Imports absolus « src/... » utilisés dans le code applicatif.
		"^src/(.*)$": "<rootDir>/src/$1",
		// lodash-es est publié en ESM pur, que Jest (CommonJS) ne sait pas
		// charger : la version CommonJS équivalente est utilisée en test.
		"^lodash-es$": "lodash",
		"^lodash-es/(.*)$": "lodash/$1",
		// Même cas pour echarts (build UMD utilisé en test).
		"^echarts$": "<rootDir>/node_modules/echarts/dist/echarts.js",
		"^echarts/lib/(.*)$": "<rootDir>/node_modules/echarts/dist/echarts.js",
	},
	setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
	// Paquets publiés en ESM pur (à transformer par Jest) en plus des .mjs.
	transformIgnorePatterns: ['node_modules/(?!(.*\.mjs$|@kundai/))'],
};

export default config;
