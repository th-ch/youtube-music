const {injectCSS} = require('../utils');
const {Menu} = require('electron');
const path = require('path');

const is = require('electron-is');
const {getAllPlugins} = require('../../plugins/utils');
const config = require('../../config');

module.exports = win => {
	// css for custom scrollbar + disable drag area(was causing bugs)
	injectCSS(win.webContents, path.join(__dirname, 'style.css'));
	win.on('ready-to-show', () => {
		const menu = Menu.buildFromTemplate(mainMenuTemplate(win));
		Menu.setApplicationMenu(menu);
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
				return {
					label: plugin,
					type: 'checkbox',
					checked: config.plugins.isEnabled(plugin),
					click: item => {
						// CheckCheckbox(item);
						if (item.checked) {
							config.plugins.enable(plugin);
						} else {
							config.plugins.disable(plugin);
						}

						checkCheckbox(item);
					}
				};
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
						label: 'Hide menu',
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
	{
		label: 'View',
		submenu: [
			{role: 'reload'},
			{role: 'forceReload'},
			{type: 'separator'},
			{role: 'zoomIn'},
			{role: 'zoomOut'},
			{role: 'resetZoom'}
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
			}
		]
	}
];
