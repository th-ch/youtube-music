const { join } = require("path");

const { ipcMain } = require("electron");
const is = require("electron-is");
const fetch = require("node-fetch");

const { cleanupName } = require("../../providers/song-info");
const { injectCSS } = require("../utils");

module.exports = async (win) => {
	injectCSS(win.webContents, join(__dirname, "style.css"));

	ipcMain.on("search-genius-lyrics", async (event, extractedSongInfo) => {
		const metadata = JSON.parse(extractedSongInfo);
		const queryString = `${cleanupName(metadata.artist)} ${cleanupName(
			metadata.title
		)}`;

		event.returnValue = await fetchFromGenius(queryString);
	});
};

const fetchFromGenius = async (queryString) => {
	let response = await fetch(
		`https://genius.com/api/search/multi?per_page=5&q=${encodeURI(queryString)}`
	);
	if (!response.ok) {
		return null;
	}

	const info = await response.json();
	let url = "";
	try {
		url = info.response.sections.filter((section) => section.type === "song")[0]
			.hits[0].result.url;
	} catch {
		return null;
	}

	if (is.dev()) {
		console.log("Fetching lyrics from Genius:", url);
	}

	response = await fetch(url);
	if (!response.ok) {
		return null;
	}

	return await response.text();
};
