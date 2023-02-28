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
	let lyrics;

	/* Uses Regex to test the title and artist first for said characters if romanization is enabled. Otherwise normal
	Genius Lyrics behavior is observed.
	*/
	let regexEastAsianChars = new RegExp("[\u{3040}-\u{30ff}\u{3400}-\u{4dbf}\u{4e00}-\u{9fff}\u{f900}-\u{faff}\u{ff66}-\u{ff9f}]");
	let hasAsianChars = false;
	if (revRomanized && (regexEastAsianChars.test(songTitle) || regexEastAsianChars.test(songArtist))) {
		lyrics = getSongs(`${songArtist} ${songTitle} Romanized`);
		hasAsianChars = true;
	} else {
		lyrics = getSongs(`${songArtist} ${songTitle}`);
	}

	/* If the romanization toggle is on, and we did not detect any characters in the title or artist, we do a check
	for characters in the lyrics themselves. If this check proves true, we search for Romanized lyrics.
	*/
	if(revRomanized && !hasAsianChars && regexEastAsianChars.test(lyrics)) {
		lyrics = getSongs(`${songArtist} ${songTitle} Romanized`);
	}
	return lyrics;
};

/**
 * Fetches a JSON of songs which is then parsed and passed into getLyrics to get the lyrical content of the first song 
 * @param {*} queryString 
 * @returns The lyrics of the first song found using the Genius-Lyrics API
 */
const getSongs = async (queryString) => {
	if (is.dev()) {
		console.log("Query String:", queryString);
	}
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
	let lyrics = await getLyrics(url);
	return lyrics;
}

/**
 *  
 * @param {*} url 
 * @returns The lyrics of the song URL provided, null if none
 */
const getLyrics = async (url) => {
	response = await fetch(url);
	if (!response.ok) {
		return null;
	}
	if (is.dev()) {
		console.log("Fetching lyrics from Genius:", url);
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