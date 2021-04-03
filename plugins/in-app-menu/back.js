const path = require("path");

const { Menu } = require("electron");
const electronLocalshortcut = require("electron-localshortcut");

const config = require("../../config");
const { setApplicationMenu } = require("../../menu");
const { injectCSS } = require("../utils");

//check that menu doesn't get created twice
let done = false;
//tracks menu visibility
let visible = true;
// win hook for fixing menu
let win;

const originalBuildMenu = Menu.buildFromTemplate;
// This function natively gets called on all submenu so no more reason to use recursion
Menu.buildFromTemplate = (template) => {
	// Fix checkboxes and radio buttons
	updateTemplate(template);

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
		//fix bug when loading window with no internet connection
		switchMenuVisibility();

		//register keyboard shortcut && hide menu if hideMenu is enabled
		if (config.get("options.hideMenu")) {
			visible = false;
			electronLocalshortcut.register(win, "Esc", () => {
				switchMenuVisibility();
			});
		}
		// fix bug with menu not applying on start
		setMenuVisibility(visible);
	});
};

function switchMenuVisibility() {
	setMenuVisibility(!visible);
}

function setMenuVisibility(value){
	visible = value;
	win.webContents.send("updateMenu", visible);
}

function updateCheckboxesAndRadioButtons(item, isRadio, hasSubmenu) {
	if (!isRadio) {
	//fix checkbox
	item.checked = !item.checked;
	} 
	//update menu if radio / hasSubmenu
	if (isRadio || hasSubmenu) {
	win.webContents.send("updateMenu", true);
	}
}

// Update checkboxes/radio buttons
function updateTemplate(template) {
	for (let item of template) {
		// Change onClick of checkbox+radio
		if ((item.type === "checkbox" || item.type === "radio") && !item.fixed) {
			let originalOnclick = item.click;
			item.click = (itemClicked) => {
				originalOnclick(itemClicked);
				updateCheckboxesAndRadioButtons(itemClicked, item.type==='radio', item.hasSubmenu);
			};
			item.fixed = true;
		}
	}
}
