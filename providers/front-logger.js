const { ipcRenderer } = require("electron");

function logToString(log) {
	return (typeof log === "string") ?
		log :
		JSON.stringify(log, null, "\t");
}

module.exports = () => {
	ipcRenderer.on("log", (_event, log) => {
		console.log(logToString(log));
	});
};
