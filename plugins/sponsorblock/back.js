const fetch = require("node-fetch");
const is = require("electron-is");
const { ipcMain } = require("electron");

const defaultConfig = require("../../config/defaults");
const { sortSegments } = require("./segments");

let videoID;

module.exports = (win, options) => {
	const { apiURL, categories } = {
		...defaultConfig.plugins.sponsorblock,
		...options,
	};

	ipcMain.on("video-src-changed", async (_, data) => {
		videoID = JSON.parse(data)?.videoDetails?.videoId;
		const segments = await fetchSegments(apiURL, categories);
		win.webContents.send("sponsorblock-skip", segments);
	});
};


const fetchSegments = async (apiURL, categories) => {
	const sponsorBlockURL = `${apiURL}/api/skipSegments?videoID=${videoID}&categories=${JSON.stringify(
		categories
	)}`;
	try {
		const resp = await fetch(sponsorBlockURL, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
			redirect: "follow",
		});
		if (resp.status !== 200) {
			return [];
		}
		const segments = await resp.json();
		const sortedSegments = sortSegments(
			segments.map((submission) => submission.segment)
		);

		return sortedSegments;
	} catch (e) {
		if (is.dev()) {
			console.log('error on sponsorblock request:', e);
		}
		return [];
	}
};
