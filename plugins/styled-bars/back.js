const { injectCSS } = require('../utils');
const { Menu } = require('electron');
const path = require('path');
const electronLocalshortcut = require("electron-localshortcut");
const config = require('../../config');
var { mainMenuTemplate } = require("../../menu");

//override menu template for custom menu
const originTemplate = mainMenuTemplate;
mainMenuTemplate = function (winHook) {
	//get template
	let template = originTemplate(winHook);
	//fix checkbox and roles
	fixMenu(template);
	//return as normal
	return template;
}
//win hook for fixing menu
let win;

//check that menu doesn't get created twice
let done = false;

module.exports = winImport => {
	win = winImport;
	// css for custom scrollbar + disable drag area(was causing bugs)
	injectCSS(win.webContents, path.join(__dirname, 'style.css'));
	win.on('ready-to-show', () => {
		// (apparently ready-to-show is called twice)		
		if (done) {
			return
		}
		done = true;
		let template = mainMenuTemplate(win);
		let menu = Menu.buildFromTemplate(template);
		Menu.setApplicationMenu(menu);
		
		//register keyboard shortcut && hide menu if hideMenu is enabled
		if (config.get('options.hideMenu')) {
			switchMenuVisibility();
			electronLocalshortcut.register(win, 'Esc', () => {
				switchMenuVisibility();
			});
		}
	});
};

let visible = true;
function switchMenuVisibility() {
	visible=!visible;
	win.webContents.send('updateMenu',visible)
}

//go over each item in menu
function fixMenu(template) {
	for (let index in template) {
		let item = template[index];
		//apply function on submenu
		if (item.submenu != null) {
			fixMenu(item.submenu);
		}
		//change onClick of checkbox+radio
		else if (item.type === 'checkbox' || item.type === 'radio') {
			let ogOnclick = item.click;
			item.click = (itemClicked) => {
				ogOnclick(itemClicked);
				checkCheckbox(itemClicked);
			};
		}
		//customize roles
		else if (item.role != null) {
			fixRoles(item)
		}
	}
}

//custom menu doesn't support roles, so they get injected manually
function fixRoles(MenuItem) {
	switch (MenuItem.role) {
		case 'reload':
			MenuItem.label = 'Reload';
			MenuItem.click = () => { win.webContents.reload(); }
			break;
		case 'forceReload':
			MenuItem.label = 'Force Reload';
			MenuItem.click = () => { win.webContents.reloadIgnoringCache(); }
			break;
		case 'zoomIn':
			MenuItem.label = 'Zoom In';
			MenuItem.click = () => { win.webContents.setZoomLevel(win.webContents.getZoomLevel() + 1); }
			break;
		case 'zoomOut':
			MenuItem.label = 'Zoom Out';
			MenuItem.click = () => { win.webContents.setZoomLevel(win.webContents.getZoomLevel() - 1); }
			break;
		case 'resetZoom':
			MenuItem.label = 'Reset Zoom';
			MenuItem.click = () => { win.webContents.setZoomLevel(0); }
			break;
		default:
			console.log(`Error fixing MenuRoles: "${MenuItem.role}" was not expected`);
	}
	delete MenuItem.role;
}

function checkCheckbox(item) {
	//check item
	item.checked = !item.checked;
	//update menu (closes it)
	win.webContents.send('updateMenu', true);
}
