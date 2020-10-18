const path = require("path");

const { Menu, nativeImage, Tray } = require("electron");

const { mainMenuTemplate } = require("./menu");
const { isTrayEnabled } = require("./store");
const { clickInYoutubeMusic } = require("./utils/youtube-music");

// Prevent tray being garbage collected
let tray;

module.exports.setUpTray = (app, win) => {
	if (!isTrayEnabled()) {
		tray = undefined;
		return;
	}

	const iconPath = path.join(__dirname, "assets", "youtube-music-tray.png");
	let trayIcon = nativeImage.createFromPath(iconPath).resize({
		width: 16,
		height: 16,
	});
	tray = new Tray(trayIcon);
	tray.setToolTip("Youtube Music");
	tray.setIgnoreDoubleClickEvents(true);
	tray.on("click", () => {
		win.isVisible() ? win.hide() : win.show();
	});

	const trayMenu = Menu.buildFromTemplate([
		{
			label: "Play/Pause",
			click: () => {
				clickInYoutubeMusic(
					win,
					"#left-controls > div > paper-icon-button.play-pause-button.style-scope.ytmusic-player-bar"
				);
			},
		},
		{
			label: "Next",
			click: () => {
				clickInYoutubeMusic(
					win,
					"#left-controls > div > paper-icon-button.next-button.style-scope.ytmusic-player-bar"
				);
			},
		},
		{
			label: "Previous",
			click: () => {
				clickInYoutubeMusic(
					win,
					"#left-controls > div > paper-icon-button.previous-button.style-scope.ytmusic-player-bar"
				);
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
	]);
	tray.setContextMenu(trayMenu);
};
