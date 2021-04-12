const { ipcRenderer } = require("electron");

function logToString(log) {
	let string = (typeof log === "string") ? log : log.toString();
	if (!string || string.includes("[object Object]")) {
		string = JSON.stringify(log, null, "\t");
	}
	return string;
}

module.exports = () => {
	ipcRenderer.on("log", (event, log) => {
		console.log(logToString(log));
	});
};
