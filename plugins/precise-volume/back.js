/*
This is used to determine if plugin is actually active
(not if its only enabled in options)
*/
let enabled = false;

module.exports = (win) => {
	enabled = true;

	//did-finish-load is called after DOMContentLoaded.
	//thats the reason the timing is controlled from main
	win.webContents.once("did-finish-load", () => {
		win.webContents.send("restoreAddEventListener");
	});
};

module.exports.enabled = () => {
	return enabled;
};
