const { triggerAction } = require("../utils");

const CHANNEL = "navigation";
const ACTIONS = {
	NEXT: "next",
	BACK: "back",
};

function goToNextPage() {
	triggerAction(CHANNEL, ACTIONS.NEXT);
}

function goToPreviousPage() {
	triggerAction(CHANNEL, ACTIONS.BACK);
}

module.exports = {
	CHANNEL: CHANNEL,
	ACTIONS: ACTIONS,
	actions: {
		goToNextPage: goToNextPage,
		goToPreviousPage: goToPreviousPage,
	},
};
