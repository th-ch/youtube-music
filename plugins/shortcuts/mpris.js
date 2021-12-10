const mpris = require("mpris-service");
const { ipcMain } = require("electron");
const registerCallback = require("../../providers/song-info");
const getSongControls = require("../../providers/song-controls");

function setupMPRIS() {
	const player = mpris({
		name: "youtube-music",
		identity: "YouTube Music",
		canRaise: true,
		supportedUriSchemes: ["https"],
		supportedMimeTypes: ["audio/mpeg"],
		supportedInterfaces: ["player"],
		desktopEntry: "youtube-music",
	});

	return player;
}

function registerMPRIS(win) {
	const songControls = getSongControls(win);
	const { playPause, next, previous } = songControls;
	try {
		const secToMicro = n => Math.round(Number(n) * 1e6);
		const microToSec = n => Math.round(Number(n) / 1e6);

		const seekTo = e => win.webContents.send("seekTo", microToSec(e.position));
		const seekBy = o => win.webContents.send("seekBy", microToSec(o));

		const player = setupMPRIS();

		ipcMain.on('seeked', (_, t) => player.seeked(secToMicro(t)));

		let currentSeconds = 0;
		ipcMain.on('timeChanged', (_, t) => currentSeconds = t);

		player.getPosition = () => secToMicro(currentSeconds)

		player.on("raise", () => {
			win.setSkipTaskbar(false);
			win.show();
		});

		player.on("play", () => {
			if (player.playbackStatus !== 'Playing') {
				player.playbackStatus = 'Playing';
				playPause()
			}
		});
		player.on("pause", () => {
			if (player.playbackStatus !== 'Paused') {
				player.playbackStatus = 'Paused';
				playPause()
			}
		});

		player.on("playpause", playPause);
		player.on("next", next);
		player.on("previous", previous);

		player.on('seek', seekBy);
		player.on('position', seekTo);

		registerCallback(songInfo => {
			if (player) {
				const data = {
					'mpris:length': secToMicro(songInfo.songDuration),
					'mpris:artUrl': songInfo.imageSrc,
					'xesam:title': songInfo.title,
					'xesam:artist': songInfo.artist,
					'mpris:trackid': '/'
				};
				if (songInfo.album) data['xesam:album'] = songInfo.album;
				player.metadata = data;
				player.seeked(secToMicro(songInfo.elapsedSeconds))
				player.playbackStatus = songInfo.isPaused ? "Paused" : "Playing"
			}
		})

	} catch (e) {
		console.warn("Error in MPRIS", e);
	}
}

module.exports = registerMPRIS;
