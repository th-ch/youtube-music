const path = require("path");

const NodeEnvironment = require("jest-environment-node");
const { _electron: electron } = require("playwright");

class TestEnvironment extends NodeEnvironment {
	constructor(config) {
		super(config);
	}

	async setup() {
		await super.setup();

		const appPath = path.resolve(__dirname, "..");
		this.global.__APP__ = await electron.launch({ args: [appPath] });
	}

	async teardown() {
		if (this.global.__APP__) {
			await this.global.__APP__.close();
		}
		await super.teardown();
	}

	runScript(script) {
		return super.runScript(script);
	}
}

module.exports = TestEnvironment;
