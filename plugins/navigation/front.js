const { ipcRenderer } = require("electron");

const { ElementFromFile, templatePath } = require("../utils");

function run() {
	ipcRenderer.on("navigation-css-ready", () => {
		const forwardButton = ElementFromFile(
			templatePath(__dirname, "forward.html")
		);
		const backButton = ElementFromFile(templatePath(__dirname, "back.html"));
		const menu = document.querySelector("#right-content");

		if (menu) {
			menu.prepend(backButton, forwardButton);
		}
	});
}

module.exports = run;
