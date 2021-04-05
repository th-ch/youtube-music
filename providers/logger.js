const { ipcRenderer } = require("electron");

module.exports = () => {
    ipcRenderer.on("log", (event, log) => {
        let string = log || log.toString();
		if (!string || string === "[object Object]") {
			string = JSON.stringify(log);
		} 
		console.log(string);
    })
};