const mpris = require("mpris-service");
const { ipcMain } = require("electron");
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
	const { playPause, next, previous, volumeMinus10, volumePlus10 } = songControls;
	try {
		const secToMicro = n => Math.round(Number(n) * 1e6);
		const microToSec = n => Math.round(Number(n) / 1e6);

		const seekTo = e => win.webContents.send("seekTo", microToSec(e.position));
		const seekBy = o => win.webContents.send("seekBy", microToSec(o));

		const player = setupMPRIS();

		ipcMain.on('seeked', (_, t) => player.seeked(secToMicro(t)));

		let currentSeconds = 0;
		ipcMain.on('timeChanged', (_, t) => currentSeconds = t);

		let currentLoopStatus = undefined;
		let manuallySwitchingStatus = false;
		ipcMain.on("repeatChanged", (_, mode) => {
			if (manuallySwitchingStatus)
				return;

			if (mode === "Repeat off")
				currentLoopStatus = "None";
			else if (mode === "Repeat one")
				currentLoopStatus = "Track";
			else if (mode === "Repeat all")
				currentLoopStatus = "Playlist";

			player.loopStatus = currentLoopStatus;
		});
		player.on("loopStatus", (status) => {
			// switchRepeat cycles between states in that order
			const switches = ["None", "Playlist", "Track"];
			const currentIndex = switches.indexOf(currentLoopStatus);
			const targetIndex = switches.indexOf(status);

			// Get a delta in the range [0,2]
			const delta = (targetIndex - currentIndex + 3) % 3;

			manuallySwitchingStatus = true;
			songControls.switchRepeat(delta);
			manuallySwitchingStatus = false;
		})

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
		player.on("playpause", () => {
			player.playbackStatus = player.playbackStatus === 'Playing' ? "Paused" : "Playing";
			playPause();
		});

		player.on("next", next);
		player.on("previous", previous);

		player.on('seek', seekBy);
		player.on('position', seekTo);

		ipcMain.on('volumeChanged', (_, value) => {
			player.volume = value;
		});
		player.on('volume', (newVolume) => {
			if (config.plugins.isEnabled('precise-volume')) {
				// With precise volume we can set the volume to the exact value.
				win.webContents.send('setVolume', newVolume)
			} else {
				// With keyboard shortcuts we can only change the volume in increments of 10, so round it.
				const deltaVolume = Math.round((newVolume - player.volume) / 10);

				if (deltaVolume > 0) {
					for (let i = 0; i < deltaVolume; i++)
						volumePlus10();
				} else {
					for (let i = 0; i < -deltaVolume; i++)
						volumeMinus10();
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
				player.seeked(secToMicro(songInfo.elapsedSeconds))
				player.playbackStatus = songInfo.isPaused ? "Paused" : "Playing"
			}
		})

	} catch (e) {
		console.warn("Error in MPRIS", e);
	}
}

module.exports = registerMPRIS;
