const { loadAdBlockerEngine } = require("./blocker");
const config = require("./config");

module.exports = async (win, options) => {
	if (await config.shouldUseBlocklists()) {
		loadAdBlockerEngine(
			win.webContents.session,
			options.cache,
			options.additionalBlockLists,
			options.disableDefaultLists,
		);
	}
};
