const { setOptions, setMenuOptions } = require('../../config/plugins');
const defaultConfig = require('../../config/defaults');

let config = defaultConfig.plugins['notifications'];

module.exports.init = (options) => {
    config = { ...config, ...options };
};

module.exports.setAndMaybeRestart = (option, value) => {
    config[option] = value;
    setMenuOptions('notifications', config);
};

module.exports.set = (option, value) => {
    config[option] = value;
    setOptions('notifications', config);
};

module.exports.get = (option) => {
    const res = config[option];
    return res;
};
