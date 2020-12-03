const plugins = require("./plugins");
const store = require("./store");

const set = (key, value) => {
	store.set(key, value);
};

const get = (key) => {
	return store.get(key);
};

module.exports = {
	get,
	set,
	edit: () => store.openInEditor(),
	watch: (cb) => {
		store.onDidChange("options", cb);
		store.onDidChange("plugins", cb);
	},
	plugins,
};
