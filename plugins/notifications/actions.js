const { triggerAction } = require("../utils");

const CHANNEL = "notification";
const ACTIONS = {
	NOTIFICATION: "notification",
};

function notify(info) {
	triggerAction(CHANNEL, ACTIONS.NOTIFICATION, info);
}

module.exports = {
	CHANNEL,
	ACTIONS,
	global: {
		notify,
	},
};
