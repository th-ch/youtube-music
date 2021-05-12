/*
This is used to determine if plugin is actually active
(not if its only enabled in options)
*/
let enabled = false;

module.exports = (win) => {
	enabled = true;

	win.webContents.once("did-finish-load", () => {
		win.webContents.send("did-finish-load");
	});
};

module.exports.enabled = () => {
	return enabled;
};
