const getSongControls = require('../../providers/song-controls');
const getSongInfo = require('../../providers/song-info');
const path = require('path');

module.exports = win => {
	win.hide = function () {
		win.minimize();
		win.setSkipTaskbar(true);
	};

	const show = win.show;
	win.show = function () {
		win.restore();
		win.focus();
		win.setSkipTaskbar(false);
		show.apply(win);
	};

	win.isVisible = function () {
		return !win.isMinimized();
	};

	const registerCallback = getSongInfo(win);
	const {playPause, next, previous} = getSongControls(win);

	// If the page is ready, register the callback
	win.once('ready-to-show', () => {
		registerCallback(songInfo => {
			// Wait for song to start before setting thumbar
			if (songInfo.title === '') {
				return;
			}

			// Win32 require full rewrite of components
			win.setThumbarButtons([
				{
					tooltip: 'Previous',
					icon: get('backward.png'),
					click() {previous(win.webContents);}
				}, {
					tooltip: 'Play/Pause',
					// Update icon based on play state
					icon: songInfo.isPaused ? get('play.png') : get('pause.png'),
					click() {playPause(win.webContents);}
				}, {
					tooltip: 'Next',
					icon: get('forward.png'),
					click() {next(win.webContents);}
				}
			]);
		});
	});
};

// Util
function get(file) {
	return path.join(__dirname,"assets", file);
}
