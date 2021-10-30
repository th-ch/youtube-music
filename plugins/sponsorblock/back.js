const fetch = require("node-fetch");
const is = require("electron-is");

// see https://github.com/node-fetch/node-fetch/issues/568#issuecomment-932200523
// will not be needed if project's electron version >= v15.1.0 (https://github.com/node-fetch/node-fetch/issues/568#issuecomment-932435180)
const https = require("https");
const agent = new https.Agent({
	rejectUnauthorized: false,
});

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
			agent // fixes error: 'CERT_HAS_EXPIRED'
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
