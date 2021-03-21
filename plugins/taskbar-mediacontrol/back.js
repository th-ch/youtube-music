const getSongControls = require("../../providers/song-controls");
const getSongInfo = require("../../providers/song-info");
const path = require('path');

module.exports = win => {
  const registerCallback = getSongInfo(win);
	const { playPause, next, previous} = getSongControls(win);

  // If the page is ready, register the callback
  win.on("ready-to-show", () => {
    // Register the callback
		registerCallback((songInfo) => {
			// Song information changed, so lets update the the playPause button
      win.setThumbarButtons([
        {
          tooltip: 'Previous',
          icon: get('backward.png'),
          click () { previous(win.webContents) }
        }, {
          tooltip: 'Play/Pause',
          icon: songInfo.isPaused ? get('play.png') : get('pause.png'),
          click () { playPause(win.webContents) }
        } , {
          tooltip: 'Next',
          icon: get('forward.png'),
          click () { next(win.webContents) }
        }
      ])
    });
  });
};

function get (address) {
  return path.join(__dirname,address);
}