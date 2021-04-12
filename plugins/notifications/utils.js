const {setOptions} = require("../../config/plugins");

module.exports.urgencyLevels = [
	{name: "Low", value: "low"},
	{name: "Normal", value: "normal"},
	{name: "High", value: "critical"},
];
module.exports.setUrgency = (options, level) => {
	options.urgency = level
	setOption(options)
};
module.exports.setUnpause = (options, value) => {
	options.unpauseNotification = value
	setOption(options)
};

let setOption = options => {
	setOptions("notifications", options)
};
