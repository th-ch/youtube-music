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
		startingPage: "",
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
			autoReconnect: true, // if enabled, will try to reconnect to discord every 5 seconds after disconnecting or failing to connect
			activityTimoutEnabled: true, // if enabled, the discord rich presence gets cleared when music paused after the time specified below
			activityTimoutTime: 10 * 60 * 1000, // 10 minutes
			listenAlong: true, // add a "listen along" button to rich presence
			hideDurationLeft: false, // hides the start and end time of the song to rich presence
		},
		notifications: {
			enabled: false,
			unpauseNotification: false,
			urgency: "normal", //has effect only on Linux 
			// the following has effect only on Windows
			interactive: true,
			toastStyle: 1, // see plugins/notifications/utils for more info
			refreshOnPlayPause: false,
			trayControls: true,
			hideButtonText: false 
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
		"picture-in-picture": {
			"enabled": false,
			"alwaysOnTop": true,
			"savePosition": true,
			"saveSize": false,
			"hotkey": "P"
		},
		"captions-selector": {
			enabled: false,
			disableCaptions: false
		},
		"skip-silences": {
			onlySkipBeginning: false,
		},
		visualizer: {
			enabled: false,
			type: "butterchurn",
			// Config per visualizer
			butterchurn: {
				preset: "martin [shadow harlequins shape code] - fata morgana",
				renderingFrequencyInMs: 500,
				blendTimeInSeconds: 2.7,
			},
			vudio: {
				effect: "lighting",
				accuracy: 128,
				lighting: {
					maxHeight: 160,
					maxSize: 12,
					lineWidth: 1,
					color: "#49f3f7",
					shadowBlur: 2,
					shadowColor: "rgba(244,244,244,.5)",
					fadeSide: true,
					prettify: false,
					horizontalAlign: "center",
					verticalAlign: "middle",
					dottify: true,
				},
			},
			wave: {
				animations: [
					{
						type: "Cubes",
						config: {
							bottom: true,
							count: 30,
							cubeHeight: 5,
							fillColor: { gradient: ["#FAD961", "#F76B1C"] },
							lineColor: "rgba(0,0,0,0)",
							radius: 20,
						},
					},
					{
						type: "Cubes",
						config: {
							top: true,
							count: 12,
							cubeHeight: 5,
							fillColor: { gradient: ["#FAD961", "#F76B1C"] },
							lineColor: "rgba(0,0,0,0)",
							radius: 10,
						},
					},
					{
						type: "Circles",
						config: {
							lineColor: {
								gradient: ["#FAD961", "#FAD961", "#F76B1C"],
								rotate: 90,
							},
							lineWidth: 4,
							diameter: 20,
							count: 10,
							frequencyBand: "base",
						},
					},
				],
			},
		},
	},
};

module.exports = defaultConfig;
