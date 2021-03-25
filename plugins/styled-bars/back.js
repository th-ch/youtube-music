const {injectCSS} = require('../utils');
const {Menu , app} = require('electron');
const { existsSync } = require("fs");
const path = require('path');
const electronLocalshortcut = require("electron-localshortcut");
const is = require('electron-is');
const {getAllPlugins} = require('../../plugins/utils');
const config = require('../../config');

const pluginEnabledMenu = (plugin, label = "") => ({
	label: label || plugin,
	type: "checkbox",
	checked: config.plugins.isEnabled(plugin),
	click: (item) => {
		if (item.checked) {
			config.plugins.enable(plugin);
		} else {
			config.plugins.disable(plugin);
		}
		checkCheckbox(item);
	},
});

var enabled = !config.get('options.hideMenu');

//override Menu.setApplicationMenu to also point to also refresh custom menu
const setMenu = Menu.setApplicationMenu;
Menu.setApplicationMenu = function (menu) {
	setMenu.apply(Menu,menu)
	win.webContents.send('updateMenu', true);
}

module.exports = win => {
	// css for custom scrollbar + disable drag area(was causing bugs)
	injectCSS(win.webContents, path.join(__dirname, 'style.css'));
	win.on('ready-to-show', () => {
		//build new menu
		const template = mainMenuTemplate(win)
		const menu = Menu.buildFromTemplate(template);
		setMenu(menu);

		//register keyboard shortcut && hide menu if hideMenu is enabled
		if (config.get('options.hideMenu')) {
			win.webContents.send('updateMenu', false); 
			 var enabled=  false;
			electronLocalshortcut.register(win, 'Esc', () => {
				if(enabled) {
					win.webContents.send('updateMenu', false); 
					enabled = false;
				} else {
					win.webContents.send('updateMenu', true); 
					enabled =  true;
				}
			});
		} 
	});
};

function checkCheckbox(item) {
	item.checked = !item.checked;
}

// Create new template because it works abit different (need to manually change checkbox + tray is out of submenu)
const mainMenuTemplate = win => [
	{
		label: 'Plugins',
		submenu: [
			...getAllPlugins().map(plugin => {
				const pluginPath = path.join(path.dirname(path.dirname(__dirname))
					, "plugins", plugin, "menu.js");
				
				if (!config.plugins.isEnabled(plugin)) {
					return pluginEnabledMenu(plugin);
				}
				if (existsSync(pluginPath)) {
					console.log("alert in");
					const getPluginMenu = require(pluginPath);
					return {
						label: plugin,
						submenu: [
							pluginEnabledMenu(plugin, "Enabled"),
							...getPluginMenu(win, config.plugins.getOptions(plugin), () =>
								module.exports.setApplicationMenu(win)
							),
						],
					};
				}

				return pluginEnabledMenu(plugin);
			}),
			{type: 'separator'},
			{
				label: 'Advanced options',
				click: () => {
					config.edit();
				}
			}
		]
	},
	{
		label: 'Options',
		submenu: [
			{
				label: 'Auto-update',
				type: 'checkbox',
				checked: config.get('options.autoUpdates'),
				click: item => {
					config.set('options.autoUpdates', item.checked);
					checkCheckbox(item);
				}
			},
			{
				label: 'Disable hardware acceleration',
				type: 'checkbox',
				checked: config.get('options.disableHardwareAcceleration'),
				click: item => {
					config.set('options.disableHardwareAcceleration', item.checked);
					checkCheckbox(item);
				}
			},
			{
				label: 'Restart on config changes',
				type: 'checkbox',
				checked: config.get('options.restartOnConfigChanges'),
				click: item => {
					config.set('options.restartOnConfigChanges', item.checked);
					checkCheckbox(item);
				}
			},
			{
				label: 'Reset App cache when app starts',
				type: 'checkbox',
				checked: config.get('options.autoResetAppCache'),
				click: item => {
					config.set('options.autoResetAppCache', item.checked);
					checkCheckbox(item);
				}
			},
			{
				label: 'Resume last song when app starts',
				type: 'checkbox',
				checked: config.get('options.resumeOnStart'),
				click: item => {
					config.set('options.resumeOnStart', item.checked);
					checkCheckbox(item);
				}
			},
			...(is.windows() || is.linux() ?
				[
					{
						label: 'Hide menu (show with Escape key)',
						type: 'checkbox',
						checked: config.get('options.hideMenu'),
						click: item => {
							config.set('options.hideMenu', item.checked);
							checkCheckbox(item);
						}
					}
				] :
				[]),
			...(is.windows() || is.macOS()				? // Only works on Win/Mac
				// https://www.electronjs.org/docs/api/app#appsetloginitemsettingssettings-macos-windows
				[
					{
						label: 'Start at login',
						type: 'checkbox',
						checked: config.get('options.startAtLogin'),
						click: item => {
							config.set('options.startAtLogin', item.checked);
							checkCheckbox(item);
						}
					}
				] :
				[]),
				{
					label: 'Tray',
					submenu: [
						{
							label: 'Disabled',
							type: 'radio',
							checked: !config.get('options.tray'),
							click: () => {
								config.set('options.tray', false);
								config.set('options.appVisible', true);
							}
						},
						{
							label: 'Enabled + app visible',
							type: 'radio',
							checked:
								config.get('options.tray') && config.get('options.appVisible'),
							click: () => {
								config.set('options.tray', true);
								config.set('options.appVisible', true);
							}
						},
						{
							label: 'Enabled + app hidden',
							type: 'radio',
							checked:
								config.get('options.tray') && !config.get('options.appVisible'),
							click: () => {
								config.set('options.tray', true);
								config.set('options.appVisible', false);
							}
						},
						{type: 'separator'},
						{
							label: 'Play/Pause on click',
							type: 'checkbox',
							checked: config.get('options.trayClickPlayPause'),
							click: item => {
								config.set('options.trayClickPlayPause', item.checked);
								checkCheckbox(item);
							}
						}
					]
				},

			{type: 'separator'},
			{
				label: 'Toggle DevTools',
				// Cannot use "toggleDevTools" role in MacOS
				click: () => {
					const {webContents} = win;
					if (webContents.isDevToolsOpened()) {
						webContents.closeDevTools();
					} else {
						const devToolsOptions = {};
						webContents.openDevTools(devToolsOptions);
					}
				}
			},
			{
				label: 'Advanced options',
				click: () => {
					config.edit();
				}
			}
		]
	},
	{
		label: 'View',
		submenu: [
			{
			label: 'Reload',
			click: () => {win.webContents.reload();}
			},
			{
				label: 'Force Reload',
				click: () => {win.webContents.reloadIgnoringCache();}
			},
			{type: 'separator'},
			{
				label: 'Zoom In',
				click: () => {win.webContents.setZoomLevel(win.webContents.getZoomLevel() + 1);}
			},
			{
				label: 'Zoom Out',
				click: () => {win.webContents.setZoomLevel(win.webContents.getZoomLevel() - 1);}
			},
			{
				label: 'Reset Zoom',
				click: () => {win.webContents.setZoomLevel(0)}
			}
		]
	},
	{
		label: 'Navigation',
		submenu: [
			{
				label: 'Go back',
				click: () => {
					if (win.webContents.canGoBack()) {
						win.webContents.goBack();
					}
				}
			},
			{
				label: 'Go forward',
				click: () => {
					if (win.webContents.canGoForward()) {
						win.webContents.goForward();
					}
				}
			} ,
			{
				label: 'Restart App',
				click: () => {app.relaunch(); app.quit();}
			} ,
			{
				label: 'Quit App',
				click: () => {app.quit();}
			}
		]
	}
];
