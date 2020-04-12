const { ElectronBlocker } = require("@cliqz/adblocker-electron");
const { session } = require("electron");
const fetch = require("node-fetch");

const SOURCES = [
	"https://raw.githubusercontent.com/kbinani/adblock-youtube-ads/master/signed.txt"
];

module.exports = () =>
	ElectronBlocker.fromLists(fetch, SOURCES)
		.then(blocker => blocker.enableBlockingInSession(session.defaultSession))
		.catch(err => console.log("Error loading adBlocker", err));
