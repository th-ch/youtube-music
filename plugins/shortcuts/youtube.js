function _keyboardInput(webContents, key) {
	return webContents.sendInputEvent({
		type   : "keydown",
		keyCode: key
	});
}

function playPause(webContents) {
	return _keyboardInput(webContents, "Space");
}

function nextTrack(webContents) {
	return _keyboardInput(webContents, "j");
}

function previousTrack(webContents) {
	return _keyboardInput(webContents, "k");
}

function startSearch(webContents) {
	return _keyboardInput(webContents, "/");
}

module.exports = {
	playPause    : playPause,
	nextTrack    : nextTrack,
	previousTrack: previousTrack,
	startSearch  : startSearch
};
