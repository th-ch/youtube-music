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
	plugins,
};
