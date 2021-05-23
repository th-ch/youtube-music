// This is used for to control the songs
const pressKey = (window, key, modifiers = []) => {
	window.webContents.sendInputEvent({
		type: "keydown",
		modifiers,
		keyCode: key,
	});
};

module.exports = (win) => {
	return {
		// Playback
		previous: () => pressKey(win, "k"),
		next: () => pressKey(win, "j"),
		playPause: (toPlay = undefined) => win.webContents.send("playPause", toPlay),
		dislike: () => pressKey(win, "+"),
		go10sBack: () => pressKey(win, "h"),
		go10sForward: () => pressKey(win, "l"),
		go1sBack: () => pressKey(win, "h", ["shift"]),
		go1sForward: () => pressKey(win, "l", ["shift"]),
		shuffle: () => pressKey(win, "s"),
		switchRepeat: () => pressKey(win, "r"),
		// General
		volumeMinus10: () => pressKey(win, "-"),
		volumePlus10: () => pressKey(win, "="),
		dislikeAndNext: () => pressKey(win, "-", ["shift"]),
		like: () => pressKey(win, "=", ["shift"]),
		fullscreen: () => pressKey(win, "f"),
		muteUnmute: () => pressKey(win, "m"),
		maximizeMinimisePlayer: () => pressKey(win, "q"),
		// Navigation
		goToHome: () => {
			pressKey(win, "g");
			pressKey(win, "h");
		},
		goToLibrary: () => {
			pressKey(win, "g");
			pressKey(win, "l");
		},
		goToHotlist: () => {
			pressKey(win, "g");
			pressKey(win, "t");
		},
		goToSettings: () => {
			pressKey(win, "g");
			pressKey(win, ",");
		},
		search: () => pressKey(win, "/"),
		showShortcuts: () => pressKey(win, "/", ["shift"]),
	};
};
