const mpris = require("mpris-service");
const {ipcMain} = require("electron");
const registerCallback = require("../../providers/song-info");
const getSongControls = require("../../providers/song-controls");
const config = require("../../config");

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
	const {playPause, next, previous, volumeMinus10, volumePlus10, shuffle} = songControls;
	try {
		const secToMicro = n => Math.round(Number(n) * 1e6);
		const microToSec = n => Math.round(Number(n) / 1e6);

		const seekTo = e => win.webContents.send("seekTo", microToSec(e.position));
		const seekBy = o => win.webContents.send("seekBy", microToSec(o));

		const player = setupMPRIS();

		ipcMain.on('seeked', (_, t) => player.seeked(secToMicro(t)));

		let currentSeconds = 0;
		ipcMain.on('timeChanged', (_, t) => currentSeconds = t);

		ipcMain.on("repeatChanged", (_, mode) => {
			if (mode === "Repeat off")
				player.loopStatus = mpris.LOOP_STATUS_NONE;
			else if (mode === "Repeat one") //MPRIS Playlist and Track Codes are switched to look the same as yt-music icons
				player.loopStatus = mpris.LOOP_STATUS_PLAYLIST;
			else if (mode === "Repeat all")
				player.loopStatus = mpris.LOOP_STATUS_TRACK;
		});
		player.on("loopStatus", (status) => {
			// switchRepeat cycles between states in that order
			const switches = [mpris.LOOP_STATUS_NONE, mpris.LOOP_STATUS_PLAYLIST, mpris.LOOP_STATUS_TRACK];
			const currentIndex = switches.indexOf(player.loopStatus);
			const targetIndex = switches.indexOf(status);

			// Get a delta in the range [0,2]
			const delta = (targetIndex - currentIndex + 3) % 3;
			songControls.switchRepeat(delta);
		})

		player.getPosition = () => secToMicro(currentSeconds)

		player.on("raise", () => {
			win.setSkipTaskbar(false);
			win.show();
		});

		player.on("play", () => {
			if (player.playbackStatus !== mpris.PLAYBACK_STATUS_PLAYING) {
				player.playbackStatus = mpris.PLAYBACK_STATUS_PLAYING;
				playPause()
			}
		});
		player.on("pause", () => {
			if (player.playbackStatus !== mpris.PLAYBACK_STATUS_PAUSED) {
				player.playbackStatus = mpris.PLAYBACK_STATUS_PAUSED;
				playPause()
			}
		});
		player.on("playpause", () => {
			player.playbackStatus = player.playbackStatus === mpris.PLAYBACK_STATUS_PLAYING ? mpris.PLAYBACK_STATUS_PAUSED : mpris.PLAYBACK_STATUS_PLAYING;
			playPause();
		});

		player.on("next", next);
		player.on("previous", previous);

		player.on('seek', seekBy);
		player.on('position', seekTo);

		player.on('shuffle', (enableShuffle) => {
			shuffle();
		});

		ipcMain.on('volumeChanged', (_, value) => {
			if (config.plugins.isEnabled('precise-volume')) {
				player.volume = value / 100;
			}
		});
		player.on('volume', (newVolume) => {
			if (config.plugins.isEnabled('precise-volume')) {
				// With precise volume we can set the volume to the exact value.
				win.webContents.send('setVolume', newVolume * 100)
			} else {
				// With keyboard shortcuts we can only change the volume in increments of 10, so round it.
				let deltaVolume = Math.round((newVolume - player.volume) * 10);
				while (deltaVolume !== 0 && deltaVolume > 0) {
					volumePlus10();
					player.volume = player.volume + 0.1;
					deltaVolume--;
				}
				while (deltaVolume !== 0 && deltaVolume < 0) {
					volumeMinus10();
					player.volume = player.volume - 0.1;
					deltaVolume++;
				}
			}
		});

		registerCallback(songInfo => {
			if (player) {
				const data = {
					'mpris:length': secToMicro(songInfo.songDuration),
					'mpris:artUrl': songInfo.imageSrc,
					'xesam:title': songInfo.title,
					'xesam:artist': [songInfo.artist],
					'mpris:trackid': '/'
				};
				if (songInfo.album) data['xesam:album'] = songInfo.album;
				player.metadata = data;
				player.seeked(secToMicro(songInfo.elapsedSeconds));
				player.playbackStatus = songInfo.isPaused ? mpris.PLAYBACK_STATUS_PAUSED : mpris.PLAYBACK_STATUS_PLAYING;
			}
		})

	} catch (e) {
		console.warn("Error in MPRIS", e);
	}
}

module.exports = registerMPRIS;
