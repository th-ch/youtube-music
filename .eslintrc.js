module.exports = {
	env: {
		browser: true,
		commonjs: true,
		es2021: true,
	},
	extends: ['airbnb-base', 'prettier'],
	parserOptions: {
		ecmaVersion: 'latest',
	},
	rules: {
		'import/no-extraneous-dependencies': 'off',
		'no-console': 'off',
		'prettier/prettier': 'error',
	},
	//plugins: ['prettier'],
};
