const { ipcRenderer } = require("electron");

module.exports = () => {
    ipcRenderer.on("log", (event, log) => {
        let string = log.toString() || log;
		if (!string || string === "[object Object]") {
			string = JSON.stringify(log);
		} 
		console.log(string);
    })
};