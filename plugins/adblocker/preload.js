const config = require("./config");

module.exports = async () => {
	if (await config.shouldUseBlocklists()) {
		// Preload adblocker to inject scripts/styles
		require("@cliqz/adblocker-electron-preload");
	} else if ((await config.get("blocker")) === config.blockers.InPlayer) {
		require("./inject");
	}
};
