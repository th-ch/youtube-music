const { setOptions, setMenuOptions } = require("../../config/plugins");
const defaultConfig = require("../../config/defaults");

let config = defaultConfig.plugins["downloader"];

module.exports.init = (options) => {
	config = { ...config, ...options };
};

module.exports.setAndMaybeRestart = (option, value) => {
	config[option] = value;
	setMenuOptions("downloader", config);
};

module.exports.set = (option, value) => {
	config[option] = value;
	setOptions("downloader", config);
};

module.exports.get = (option) => {
	let res = config[option];
	return res;
};
