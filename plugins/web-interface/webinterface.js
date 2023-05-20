//const mpris = require("mpris-service");
const { ipcMain } = require("electron");
const registerCallback = require("../../providers/song-info");
const getSongControls = require("../../providers/song-controls");
const config = require("../../config");
const path = require('path');

const express = require('express');

// Create an Express application
const app = express();
const port = 9669; // Choose a port number


win_global = null;

// basic data struct
// we add volume
song = {
	title: "",
	artist: "",
	views: 0,
	uploadDate: "",
	imageSrc: "",
	image: null,
	isPaused: undefined,
	songDuration: 0,
	elapsedSeconds: 0,
	url: "",
	album: undefined,
	videoId: "",
	playlistId: "",
};
/** @param {Electron.BrowserWindow} win */
function registerlisterners(win) {
	try {
		win_global=win;
		const secToMicro = n => Math.round(Number(n) * 1e6);
		const microToSec = n => Math.round(Number(n) / 1e6);

		/* seekto seekby
		const seekTo = e => win.webContents.send("seekTo", microToSec(e.position));
		const seekBy = o => win.webContents.send("seekBy", microToSec(o));
		*/
		ipcMain.on("apiLoaded", () => {
			win.webContents.send("setupSeekedListener", "webinterface");
			win.webContents.send("setupTimeChangedListener", "webinterface");
			win.webContents.send("setupRepeatChangedListener", "webinterface");
			win.webContents.send("setupVolumeChangedListener", "webinterface");
		});

		// updations
		ipcMain.on('seeked', (_, t) => song["elaspedSeconds"]=t);

		ipcMain.on('timeChanged', (_, t) => song["elaspedSeconds"]=t);

		ipcMain.on("repeatChanged", (_, mode) => song["loopStatus"] = mode);	

		ipcMain.on('volumeChanged', (_, newVol) => song["volume"] = newVol);

		registerCallback(songInfo => {
			Object.assign(song, songInfo);
			delete song.image; //we do not need this

		})

	} catch (e) {
		console.warn("Error in web-interface -> listeners", e);
	}
}

function doAction(action){
	//actions
	const songControls = getSongControls(win_global);
	const { playPause, next, previous, volumeMinus10, volumePlus10, shuffle } = songControls;
	try {	
		switch (action){
			case "play":
			case "pause":
			case "playpause":
				song["isPaused"] = song["isPaused"] === false ? true : false;
				playPause();
				break;
			case "next":
				next();
				break;
			case "previous":
				previous();
				break;
			case 'shuffle':
				shuffle();
				break;
			case 'looptoggle':
				songControls.switchRepeat(1);
				break;
			case 'volumeplus10':
				volumePlus10();
				break;
			case 'volumeminus10':
				volumeMinus10();
				break;
			default :
				console.log("web-interface: " + "Requested action" + action + "not found");

		}
	} catch (e) {
		console.warn("Error in web-interface -> actions", e);
	}
}

/* actions I do not understand and are not supported right now: raise?, volume, seek, position
		player.on("raise", () => {
			win.setSkipTaskbar(false);
			win.show();
		});
		player.on('volume', (newVolume) => {
			if (config.plugins.isEnabled('precise-volume')) {
				// With precise volume we can set the volume to the exact value.
				let newVol = parseInt(newVolume * 100);
				if (parseInt(player.volume * 100) !== newVol) {
					if (!autoUpdate) {
						mprisVolNewer = true;
						autoUpdate = false;
						win.webContents.send('setVolume', newVol);
					}
				}
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

		player.on('seek', seekBy);
		player.on('position', seekTo);



*/

app.get('/api', (req, res) => {
	songsend = {};
	if (req.query.fields){
		const reqFields = req.query.fields.split(","); //fields multiple at a time
		reqFields.forEach(field => {
			if (song.hasOwnProperty(field)) {
				songsend[field] = song[field];
			}
			else {
				songsend[field] = "ERROR: no such property";
			}
		});
	} else {
		songsend = song; //send everything if nothing is requested X)
	}
	if (req.query.action) {
		const reqAction = req.query.action;	//actions one at a time
		console.log("webinterface: received and trying action " +  reqAction);
		doAction(reqAction);
	}
	res.json(songsend);
});

app.get('/', function(req, res) {
	  res.sendFile(path.join(__dirname,'./index.html'));
});


// Error handling middleware
app.use((err, req, res, next) => {
	console.error("web-interface: " + err.stack);
	res.status(500).json({ error: 'Internal Server Error' });
});

// Start the serve
app.listen(port,'0.0.0.0', () => {
	console.log("web-interface: " + `Server is listening on port ${port}`);
});
app.get('/', function(req, res) {
	  res.sendFile(path.join(__dirname, '/index.html'));
});


module.exports = registerlisterners;
