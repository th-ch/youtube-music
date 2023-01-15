#!/usr/bin/env node

const { existsSync, writeFile } = require("fs");
const { join } = require("path");
const { promisify } = require("util");

/**
 * Generates a fake package.json for given packages that don't have any.
 * Allows electron-builder to resolve them
 */

const generatePackageJson = async packageName => {
	const packageFolder =  join("node_modules", packageName)
	if (!existsSync(packageFolder )) {
		console.log(
			`${packageName} module not found, exiting…`
		);
		return
	}

	const filepath = join(packageFolder, "package.json");
	if (!existsSync(filepath)) {
		console.log(
			`No package.json found for ${packageName} module, generating one…`
		);
		pkg = {
			name: packageName,
			version: "0.0.0",
			description: "-",
			repository: { type: "git", url: "-" },
			readme: "-"
		};
		const writeFileAsync = promisify(writeFile);
		await writeFileAsync(filepath, JSON.stringify(pkg, null, 2));
	}
};

if (require.main === module) {
	process.argv.slice(2).forEach(async packageName => {
		await generatePackageJson(packageName);
	});
}
