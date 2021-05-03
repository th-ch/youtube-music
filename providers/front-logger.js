const { ipcRenderer } = require("electron");

function logToString(log) {
	return (typeof log === "string") ?
		log :
		JSON.stringify(log, null, "\t");
}

module.exports = () => {
	ipcRenderer.on("log", (event, log) => {
		console.log(logToString(log));
	});
};
