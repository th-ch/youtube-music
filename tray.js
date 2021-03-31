const path = require("path");

const { Menu, nativeImage, Tray } = require("electron");

const config = require("./config");
const { mainMenuTemplate } = require("./menu");
const getSongControls = require("./providers/song-controls");

// Prevent tray being garbage collected
let tray;

module.exports.setUpTray = (app, win) => {
	if (!config.get("options.tray")) {
		tray = undefined;
		return;
	}

	const { playPause, next, previous } = getSongControls(win);
	const iconPath = path.join(__dirname, "assets", "youtube-music-tray.png");
	let trayIcon = nativeImage.createFromPath(iconPath).resize({
		width: 16,
		height: 16,
	});
	tray = new Tray(trayIcon);
	tray.setToolTip("Youtube Music");
	tray.setIgnoreDoubleClickEvents(true);
	tray.on("click", () => {
		if (config.get("options.trayClickPlayPause")) {
			playPause();
		} else {
			win.isVisible() ? win.hide() : win.show();
		}
	});

	let template = [
		{
			label: "Play/Pause",
			click: () => {
				playPause();
			},
		},
		{
			label: "Next",
			click: () => {
				next();
			},
		},
		{
			label: "Previous",
			click: () => {
				previous();
			},
		},
		{
			label: "Show",
			click: () => {
				win.show();
			},
		},
		...mainMenuTemplate(win),
		{
			label: "Quit",
			click: () => {
				app.quit();
			},
		},
	];

	// delete quit button from navigation submenu
	let navigation = getIndex(template,'Navigation');
	let quit = getIndex(template[navigation].submenu,'Quit App');
	delete template[navigation].submenu[quit];

	// delete View submenu (all buttons are useless in tray)
	delete template[getIndex(template, 'View')];

	const trayMenu = Menu.buildFromTemplate(template);
	tray.setContextMenu(trayMenu);
};

function getIndex(arr,label) {
	return arr.findIndex(item => item.label === label)
}
