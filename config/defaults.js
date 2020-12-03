const defaultConfig = {
	"window-size": {
		width: 1100,
		height: 550,
	},
	url: "https://music.youtube.com",
	options: {
		tray: false,
		appVisible: true,
		autoUpdates: true,
		hideMenu: false,
		startAtLogin: false,
		disableHardwareAcceleration: false,
	},
	plugins: {
		navigation: {
			enabled: true,
		},
		shortcuts: {
			enabled: true,
		},
		adblocker: {
			enabled: true,
		},
	},
};

module.exports = defaultConfig;
