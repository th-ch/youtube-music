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
		proxy: "",
	},
	plugins: {
		// Enabled plugins
		navigation: {
			enabled: true,
		},
		adblocker: {
			enabled: true,
			cache: true,
			additionalBlockLists: [], // Additional list of filters, e.g "https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt"
		},
		// Disabled plugins
		shortcuts: {
			enabled: false,
			overrideMediaKeys: false,
		},
		downloader: {
			enabled: false,
			ffmpegArgs: [], // e.g. ["-b:a", "192k"] for an audio bitrate of 192kb/s
			downloadFolder: undefined, // Custom download folder (absolute path)
			preset: "mp3",
		},
		"last-fm": {
			enabled: false,
			api_root: "http://ws.audioscrobbler.com/2.0/",
			api_key: "04d76faaac8726e60988e14c105d421a", // api key registered by @semvis123
			secret: "a5d2a36fdf64819290f6982481eaffa2",
		},
		discord: {
			enabled: false,
			activityTimoutEnabled: true, // if enabled, the discord rich presence gets cleared when music paused after the time specified below
			activityTimoutTime: 10 * 60 * 1000, // 10 minutes
			listenAlong: true, // add a "listen along" button to rich presence
		},
		notifications: {
			enabled: false,
			unpauseNotification: false,
			urgency: "normal", //has effect only on Linux 
			interactive: false //has effect only on Windows
		},
		"precise-volume": {
			enabled: false,
			steps: 1, //percentage of volume to change
			arrowsShortcut: true, //enable ArrowUp + ArrowDown local shortcuts
			globalShortcuts: {
				volumeUp: "",
				volumeDown: ""
			},
			savedVolume: undefined //plugin save volume between session here
		},
		sponsorblock: {
			enabled: false,
			apiURL: "https://sponsor.ajay.app",
			categories: [
				"sponsor",
				"intro",
				"outro",
				"interaction",
				"selfpromo",
				"music_offtopic",
			],
		},
		"video-toggle": {
			enabled: false,
			mode: "custom",
			forceHide: false,
		},
	},
};

module.exports = defaultConfig;
