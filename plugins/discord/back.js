const Discord = require("discord-rpc");

const getSongInfo = require("../../providers/song-info");

const rpc = new Discord.Client({
	transport: "ipc",
});

// Application ID registered by @semvis123
const clientId = "790655993809338398";

let clearActivity;

module.exports = (win, {activityTimoutEnabled, activityTimoutTime}) => {
	const registerCallback = getSongInfo(win);

	// If the page is ready, register the callback
	win.on("ready-to-show", () => {
		rpc.on("ready", () => {
			// Register the callback
			registerCallback((songInfo) => {
				// Song information changed, so lets update the rich presence
				const activityInfo = {
					details: songInfo.title,
					state: songInfo.artist,
					largeImageKey: "logo",
					largeImageText: [
						songInfo.uploadDate,
						songInfo.views.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " views"
					].join(' || '),
				};

				if (songInfo.isPaused) {
					// Add an idle icon to show that the song is paused
					activityInfo.smallImageKey = "idle";
					activityInfo.smallImageText = "idle/paused";
					// Set start the timer so the activity gets cleared after a while if enabled
					if (activityTimoutEnabled)
						clearActivity = setTimeout(()=>rpc.clearActivity(), activityTimoutTime||10,000);

				} else {
					// stop the clear activity timout
					clearTimeout(clearActivity);
					// Add the start and end time of the song
					const songStartTime = Date.now() - songInfo.elapsedSeconds * 1000;
					activityInfo.startTimestamp = songStartTime;
					activityInfo.endTimestamp =
						songStartTime + songInfo.songDuration * 1000;
				}

				rpc.setActivity(activityInfo);
			});
		});

		// Startup the rpc client
		rpc.login({
				clientId,
			})
			.catch(console.error);
	});
};
