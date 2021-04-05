const { ipcRenderer } = require("electron");

module.exports = () => {
    ipcRenderer.on("log", (event, log) => {
		let string = log.toString() || log;
		if (string) {
		console.log(string);
		} else {
			for (let propery of log) {
			console.log(propery.toString() || propery);
			}
		}
	})
}