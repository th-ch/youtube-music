// This is used for to control the songs
const pressKey = (window, key) => {
	window.webContents.sendInputEvent({
		type: "keydown",
		keyCode: key,
	});
};

module.exports = (win) => {
	return {
		previous: () => pressKey(win, "k"),
		next: () => pressKey(win, "j"),
		playPause: () => pressKey(win, "space"),
		like: () => pressKey(win, "_"),
		dislike: () => pressKey(win, "+"),
		search: () => pressKey(win, "/"),
	};
};
