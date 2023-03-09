const getSongControls = require('../../providers/song-controls');
const registerCallback = require('../../providers/song-info');
const path = require('path');

let controls;
let currentSongInfo;

module.exports = win => {
	const { playPause, next, previous } = getSongControls(win);
	controls = { playPause, next, previous };

	registerCallback(songInfo => {
		//update currentsonginfo for win.on('show')
		currentSongInfo = songInfo;
		// update thumbar
		setThumbar(win, songInfo);
	});

	// need to set thumbar again after win.show 
	win.on("show", () => {
		setThumbar(win, currentSongInfo)
	})
};

function setThumbar(win, songInfo) {
	// Wait for song to start before setting thumbar
	if (!songInfo?.title) {
		return;
	}

	// Win32 require full rewrite of components
	win.setThumbarButtons([
		{
			tooltip: 'Previous',
			icon: get('previous'),
			click() { controls.previous(win.webContents); }
		}, {
			tooltip: 'Play/Pause',
			// Update icon based on play state
			icon: songInfo.isPaused ? get('play') : get('pause'),
			click() { controls.playPause(win.webContents); }
		}, {
			tooltip: 'Next',
			icon: get('next'),
			click() { controls.next(win.webContents); }
		}
	]);
}

// Util
function get(kind) {
	return path.join(__dirname, "../../assets/media-icons-black", `${kind}.png`);
}
