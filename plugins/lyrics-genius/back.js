const { join } = require("path");

const { ipcMain } = require("electron");
const is = require("electron-is");
const { convert } = require("html-to-text");
const fetch = require("node-fetch");

const { cleanupName } = require("../../providers/song-info");
const { injectCSS } = require("../utils");
let revRomanized = false; 

module.exports = async (win, options) => {
	if(options.romanizedLyrics) {
		revRomanized = true;
	}
	injectCSS(win.webContents, join(__dirname, "style.css"));

	ipcMain.on("search-genius-lyrics", async (event, extractedSongInfo) => {
		const metadata = JSON.parse(extractedSongInfo);
		event.returnValue = await fetchFromGenius(metadata);
	});
};

const toggleRomanized = () => {
	revRomanized = !revRomanized;
	console.log("Romanized Mode: " + revRomanized);
};

const fetchFromGenius = async (metadata) => {
	const songTitle = `${cleanupName(metadata.title)}`;
	const songArtist = `${cleanupName(metadata.artist)}`;

	/* Tried using regex to test the title and artist for East Asian Characters. It works but I realized 
	some groups are fully English in both title and singer. In this case, the lyrics are  Might improve this in the future.
	*/
	let regexEastAsianChars = new RegExp("[\u{3040}-\u{30ff}\u{3400}-\u{4dbf}\u{4e00}-\u{9fff}\u{f900}-\u{faff}\u{ff66}-\u{ff9f}]");
	let hasAsianChars = false;
	if(revRomanized) {
		hasAsianChars = regexEastAsianChars.test(songTitle) || regexEastAsianChars.test(songArtist);
	}

	let queryString = revRomanized && hasAsianChars? 
	`${songArtist} ${songTitle} Romanized` : 
	`${songArtist} ${songTitle}`;
	console.log(queryString);

	let url = await getSongs(queryString);
	if (is.dev()) {
		console.log("Fetching lyrics from Genius:", url);
	}
	let lyrics = await getLyrics(url);

	if(revRomanized && !hasAsianChars && regexEastAsianChars.test(lyrics)) {
		queryString = `${songArtist} ${songTitle} Romanized`;
		let url = await getSongs(queryString);
		lyrics = await getLyrics(url);
	}
	return lyrics;
};

const getSongs = async (queryString) => {
	let response = await fetch(`https://genius.com/api/search/multi?per_page=5&q=${encodeURI(queryString)}`);
	if (!response.ok) {
		return null;
	}

	/* Fetch the first URL with the api, giving a collection of song results.
	Pick the first song, parsing the json given by the API.
	*/
	const info = await response.json();
	let url = "";
	try {
		url = info.response.sections.filter((section) => section.type === "song")[0]
			.hits[0].result.url;
	} catch {
		return null;
	}
	return url;
}

const getLyrics = async (url) => {
	response = await fetch(url);
	if (!response.ok) {
		return null;
	}

	const html = await response.text();
	const lyrics = convert(html, {
		baseElements: {
			selectors: ['[class^="Lyrics__Container"]', ".lyrics"],
		},
		selectors: [
			{
				selector: "a",
				format: "linkFormatter",
			},
		],
		formatters: {
			// Remove links by keeping only the content
			linkFormatter: (elem, walk, builder) => {
				walk(elem.children, builder);
			},
		},
	});
	return lyrics;
};

module.exports.toggleRomanized = toggleRomanized;
module.exports.fetchFromGenius = fetchFromGenius;