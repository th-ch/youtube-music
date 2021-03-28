const {setOptions} = require("../../config/plugins");

module.exports.urgencyLevels = [
	{name: "Low", value: "low"},
	{name: "Normal", value: "normal"},
	{name: "High", value: "critical"},
];
module.exports.setUrgency = (options, level) => {
	options.urgency = level
	setOptions("notifications", options)
};
