const { join } = require("path");

const { ipcMain } = require("electron");
const is = require("electron-is");
const { convert } = require("html-to-text");
const fetch = require("node-fetch");

const { cleanupName } = require("../../providers/song-info");
const { injectCSS } = require("../utils");
let eastAsianChars = /\p{Script=Han}|\p{Script=Katakana}|\p{Script=Hiragana}|\p{Script=Hangul}|\p{Script=Han}/u;
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
};

const fetchFromGenius = async (metadata) => {
	const songTitle = `${cleanupName(metadata.title)}`;
	const songArtist = `${cleanupName(metadata.artist)}`;
	let lyrics;

	/* Uses Regex to test the title and artist first for said characters if romanization is enabled. Otherwise normal
	Genius Lyrics behavior is observed.
	*/
	let hasAsianChars = false;
	if (revRomanized && (eastAsianChars.test(songTitle) || eastAsianChars.test(songArtist))) {
		lyrics = await getLyricsList(`${songArtist} ${songTitle} Romanized`);
		hasAsianChars = true;
	} else {
		lyrics = await getLyricsList(`${songArtist} ${songTitle}`);
	}

	/* If the romanization toggle is on, and we did not detect any characters in the title or artist, we do a check
	for characters in the lyrics themselves. If this check proves true, we search for Romanized lyrics.
	*/
	if(revRomanized && !hasAsianChars && eastAsianChars.test(lyrics)) {
		lyrics = await getLyricsList(`${songArtist} ${songTitle} Romanized`);
	}
	return lyrics;
};

/**
 * Fetches a JSON of songs which is then parsed and passed into getLyrics to get the lyrical content of the first song 
 * @param {*} queryString 
 * @returns The lyrics of the first song found using the Genius-Lyrics API
 */
const getLyricsList = async (queryString) => {
	let response = await fetch(
		`https://genius.com/api/search/multi?per_page=5&q=${encodeURIComponent(queryString)}`
	);
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