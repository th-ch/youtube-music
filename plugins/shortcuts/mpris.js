const mpris = require("mpris-service");

function setupMPRIS() {
	const player = mpris({
		name: "youtube-music",
		identity: "YouTube Music",
		canRaise: true,
		supportedUriSchemes: ["https"],
		supportedMimeTypes: ["audio/mpeg"],
		supportedInterfaces: ["player"],
		desktopEntry: "youtube-music",
	});

	return player;
}

module.exports = {
	setupMPRIS,
};
