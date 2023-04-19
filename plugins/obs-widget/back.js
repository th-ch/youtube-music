const {ipcMain} = require("electron");
const http = require("http");
const registerCallback = require("../../providers/song-info");

let currentSongInfo;
const data = {
	player: {
		hasSong: false,
		isPaused: true,
		seekbarCurrentPosition: 0,
	},
	track: {
		author: "",
		title: "",
		album: "",
		cover: "",
		duration: 0,
	}
};

/** @param {Electron.BrowserWindow} win */
module.exports = async (win) => {
	const requestListener = function (req, res) {
		if(req.url !== '/query'){
			res.writeHead(404);
			res.end("404 Not found!");
		}
		res.setHeader("Access-Control-Allow-Origin", "*");
		res.writeHead(200);
		if (currentSongInfo !== undefined && !currentSongInfo.title && !currentSongInfo.artist) {
			res.end(JSON.stringify({}));
			return;
		}
		data.player.hasSong = true;
		data.player.isPaused = currentSongInfo.isPaused;
		data.player.seekbarCurrentPosition = currentSongInfo.elapsedSeconds;
		data.track.author = [currentSongInfo.artist];
		data.track.title = currentSongInfo.title;
		data.track.album = currentSongInfo.album;
		data.track.cover = currentSongInfo.imageSrc;
		data.track.duration = currentSongInfo.songDuration;
		res.end(JSON.stringify(data));
	};
	const server = http.createServer(requestListener);
	server.listen(9863, "localhost", () => {
	});
	ipcMain.on('apiLoaded', () => win.webContents.send('setupTimeChangedListener'));
	ipcMain.on('timeChanged', async (_, t) => {
		if (!currentSongInfo.title || currentSongInfo.isPaused) return;
		currentSongInfo.elapsedSeconds = t;
	});

	registerCallback((songInfo) => {
		currentSongInfo = songInfo;
	});
};
