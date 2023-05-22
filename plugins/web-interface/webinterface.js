//const mpris = require("mpris-service");
const { ipcMain } = require("electron");
const registerCallback = require("../../providers/song-info");
const getSongControls = require("../../providers/song-controls");
const config = require("../../config");
const path = require('path');
const fs = require('fs');
const http = require('http');
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
		err = 0;
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
			default:
				err="web-interface: " + "Requested action" + action + "not found";
				console.log(err);
		}
	} catch (e) {
		console.warn("Error in web-interface -> actions", e);
		err="unkown error in doing requested action"
	}
	return err;
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
const server = http.createServer((req,res) => {
	err=0;
	if (req.url.slice(0,4) === '/api') {
		const action = req.url.split('?')[1]?.split('=')[1];
		if (action) {
			console.log("webinterface: received and trying action " +  action);
			err=doAction(action);
		}
		if (!err) {
			res.setHeader('Content-Type','application/json');
			res.write(JSON.stringify(song));
		}
		else {
			res.statusCode = 404;
			res.write(err);
		};
	}
	else {
		const filePath = path.join(__dirname, "index.html");
		var index = fs.readFileSync(filePath);
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.end(index);
		};
	res.end();
});
server.listen(port, () => {
	console.log(`web-interface API Server is running on port ${port}`);
});

module.exports = registerlisterners;
