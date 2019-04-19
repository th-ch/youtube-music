function getEnabledPlugins(store) {
	return store.get("plugins");
}

function isEnabled(store, plugin) {
	return store.get("plugins").indexOf(plugin) > -1;
}

function enablePlugin(store, plugin) {
	let plugins = getEnabledPlugins(store);
	if (plugins.indexOf(plugin) === -1) {
		plugins.push(plugin);
		store.set("plugins", plugins);
	}
}

function disablePlugin(store, plugin) {
	let plugins = getEnabledPlugins(store);
	let index   = plugins.indexOf(plugin);
	if (index > -1) {
		plugins.splice(index, 1);
		store.set("plugins", plugins);
	}
}

module.exports = {
	isEnabled        : isEnabled,
	getEnabledPlugins: getEnabledPlugins,
	enableplugin     : enablePlugin,
	disableplugin    : disablePlugin
};
