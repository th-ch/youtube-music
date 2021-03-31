const path = require("path");

const { Menu } = require("electron");
const electronLocalshortcut = require("electron-localshortcut");

const config = require("../../config");
const { mainMenuTemplate } = require("../../menu");
const { injectCSS } = require("../utils");

//check that menu doesn't get created twice
let done = false;

module.exports = (win) => {
	// css for custom scrollbar + disable drag area(was causing bugs)
	injectCSS(win.webContents, path.join(__dirname, "style.css"));

	win.on("ready-to-show", () => {
		// (apparently ready-to-show is called twice)
		if (done) {
			return;
		}
		done = true;
		let template = mainMenuTemplate(win, false, false, (item) => {
			checkCheckbox(win, item);
		});
		let menu = Menu.buildFromTemplate(template);
		Menu.setApplicationMenu(menu);

		//register keyboard shortcut && hide menu if hideMenu is enabled
		if (config.get("options.hideMenu")) {
			switchMenuVisibility(win);
			electronLocalshortcut.register(win, "Esc", () => {
				switchMenuVisibility(win);
			});
		}
	});
};

let visible = true;
function switchMenuVisibility(win) {
	visible = !visible;
	win.webContents.send("updateMenu", visible);
}

function checkCheckbox(win, item) {
	//check item
	item.checked = !item.checked;
	//update menu (closes it)
	win.webContents.send("updateMenu", true);
}
