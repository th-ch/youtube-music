const { setOptions, setMenuOptions } = require("../../config/plugins");

let config;

module.exports.init = (options) => {
    config = options;
}

module.exports.setAndMaybeRestart = (option, value) => {
	config[option] = value;
	setMenuOptions("notifications", config);
}

module.exports.set = (option, value) => {
    config[option] = value;
    setOptions("notifications", config);
}

module.exports.get = (option) => {
    let res = config[option];
    return res;
}
