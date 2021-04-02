const path = require("path");

const { Menu } = require("electron");
const electronLocalshortcut = require("electron-localshortcut");

const config = require("../../config");
const { setApplicationMenu } = require("../../menu");
const { injectCSS } = require("../utils");

//check that menu doesn't get created twice
let done = false;
// win hook for fixing menu
let win;

const originalBuildMenu = Menu.buildFromTemplate;
// This function natively gets called on all submenu so no more reason to use recursion
Menu.buildFromTemplate = (template) => {
	// Fix checkboxes and radio buttons
	updateCheckboxesAndRadioButtons(win, template);

	// return as normal
	return originalBuildMenu(template);
};

module.exports = (winImport) => {
	win = winImport;

	// css for custom scrollbar + disable drag area(was causing bugs)
	injectCSS(win.webContents, path.join(__dirname, "style.css"));

	win.on("ready-to-show", () => {
		// (apparently ready-to-show is called twice)
		if (done) {
			return;
		}
		done = true;

		setApplicationMenu(win);

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

// Update checkboxes/radio buttons
function updateCheckboxesAndRadioButtons(win, template) {
	for (let item of template) {
		// Change onClick of checkbox+radio
		if ((item.type === "checkbox" || item.type === "radio") && !item.fixed) {
			let originalOnclick = item.click;
			item.click = (itemClicked) => {
				originalOnclick(itemClicked);
				checkCheckbox(win, itemClicked);
			};
			item.fixed = true;
		}
	}
}
