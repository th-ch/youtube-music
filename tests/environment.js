const path = require("path");

const getPort = require("get-port");
const NodeEnvironment = require("jest-environment-node");
const { Application } = require("spectron");

class TestEnvironment extends NodeEnvironment {
	constructor(config) {
		super(config);
	}

	async setup() {
		await super.setup();

		const electronPath = path.resolve(
			__dirname,
			"..",
			"node_modules",
			".bin",
			"electron"
		);
		const appPath = path.resolve(__dirname, "..");
		const port = await getPort();

		this.global.__APP__ = new Application({
			path: electronPath,
			args: [appPath],
			port,
		});
		await this.global.__APP__.start();
		const { client } = this.global.__APP__;
		await client.waitUntilWindowLoaded();
	}

	async teardown() {
		if (this.global.__APP__.isRunning()) {
			await this.global.__APP__.stop();
		}
		await super.teardown();
	}

	runScript(script) {
		return super.runScript(script);
	}
}

module.exports = TestEnvironment;
