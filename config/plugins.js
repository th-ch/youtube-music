const store = require("./store");

function getEnabled() {
	const plugins = store.get("plugins");
	const enabledPlugins = Object.entries(plugins).filter(([plugin, options]) =>
		isEnabled(plugin)
	);
	return enabledPlugins;
}

function isEnabled(plugin) {
	const pluginConfig = store.get("plugins")[plugin];
	return pluginConfig !== undefined && pluginConfig.enabled;
}

function setOptions(plugin, options) {
	const plugins = store.get("plugins");
	store.set("plugins", {
		...plugins,
		[plugin]: {
			...plugins[plugin],
			...options,
		},
	});
}

function getOptions(plugin) {
	return store.get("plugins")[plugin];
}

function enable(plugin) {
	setOptions(plugin, { enabled: true });
}

function disable(plugin) {
	setOptions(plugin, { enabled: false });
}

module.exports = {
	isEnabled,
	getEnabled,
	enable,
	disable,
	setOptions,
	getOptions,
};
