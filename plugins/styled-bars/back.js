const { injectCSS } = require('../utils');
const { Menu } = require('electron');
const path = require('path');
const electronLocalshortcut = require("electron-localshortcut");
const config = require('../../config');
const { setApplicationMenu } = require("../../menu");

//override Menu.buildFromTemplate, making it also fix the template
const originBuildMenu = Menu.buildFromTemplate;
//this function natively gets called on all submenu so no more reason to use recursion
Menu.buildFromTemplate = function (template) {
	//fix checkbox and roles
	fixMenu(template);
	//return as normal
	return originBuildMenu(template);
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

		//refresh menu to fix it
		setApplicationMenu(win);
		
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
	for (let item of template) {
		//change onClick of checkbox+radio if not fixed
		if ((item.type === 'checkbox' || item.type === 'radio') && !item.fixed) {
			let ogOnclick = item.click;
			item.click = (itemClicked) => {
				ogOnclick(itemClicked);
				checkCheckbox(itemClicked);
			};
			item.fixed = true;
		}
		//customize roles (will be deleted soon)
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
