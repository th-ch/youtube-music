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
		restartOnConfigChanges: false,
		trayClickPlayPause: false,
		autoResetAppCache: false,
		resumeOnStart: true,
	},
	plugins: {
		// Enabled plugins
		navigation: {
			enabled: true,
		},
		shortcuts: {
			enabled: true,
		},
		adblocker: {
			enabled: true,
			cache: true,
			additionalBlockLists: [], // Additional list of filters, e.g "https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt"
		},
		// Disabled plugins
		downloader: {
			enabled: false,
			ffmpegArgs: [], // e.g. ["-b:a", "192k"] for an audio bitrate of 192kb/s
			downloadFolder: undefined, // Custom download folder (absolute path)
		},
		"last-fm": {
			enabled: false,
			api_root: "http://ws.audioscrobbler.com/2.0/",
			api_key: "04d76faaac8726e60988e14c105d421a", // api key registered by @semvis123
			secret: "a5d2a36fdf64819290f6982481eaffa2",
		}
	},
};

module.exports = defaultConfig;
