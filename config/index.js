const defaultConfig = require("./defaults");
const plugins = require("./plugins");
const store = require("./store");
const { restart } = require("../providers/app-controls");

const set = (key, value) => {
	store.set(key, value);
};

function setMenuOption(key, value) {
	set(key, value);
	if (store.get("options.restartOnConfigChanges")) restart();
}

const get = (key) => {
	return store.get(key);
};

module.exports = {
	defaultConfig,
	get,
	set,
	setMenuOption,
	edit: () => store.openInEditor(),
	watch: (cb) => {
		store.onDidChange("options", cb);
		store.onDidChange("plugins", cb);
	},
	plugins,
};
