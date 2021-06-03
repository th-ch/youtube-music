const fetch = require("node-fetch");

const defaultConfig = require("../../config/defaults");
const registerCallback = require("../../providers/song-info");
const { sortSegments } = require("./segments");

let videoID;

module.exports = (win, options) => {
	const { apiURL, categories } = {
		...defaultConfig.plugins.sponsorblock,
		...options,
	};

	registerCallback(async (info) => {
		const newURL = info.url || win.webContents.getURL();
		const newVideoID = new URL(newURL).searchParams.get("v");

		if (videoID !== newVideoID) {
			videoID = newVideoID;
			const segments = await fetchSegments(apiURL, categories);
			win.webContents.send("sponsorblock-skip", segments);
		}
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
	} catch {
		return [];
	}
};
