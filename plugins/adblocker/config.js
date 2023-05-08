const { PluginConfig } = require("../../config/dynamic");

const config = new PluginConfig("adblocker", { enableFront: true });

const blockers = {
	WithBlocklists: "With blocklists",
	InPlayer: "In player",
};

const shouldUseBlocklists = async () =>
	(await config.get("blocker")) !== blockers.InPlayer;

module.exports = { shouldUseBlocklists, blockers, ...config };
