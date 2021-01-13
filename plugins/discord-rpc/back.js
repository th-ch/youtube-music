const Discord = require('discord-rpc');
const rpc = new Discord.Client({
	transport: 'ipc'
});

const clientId = '790655993809338398';

module.exports = win => {
	// If the page is ready, register the callback
	win.on('ready-to-show', () => {
		// Startup the rpc client
		rpc.login({
			clientId
		}).catch(console.error);

		// Register the callback
		global.songInfo.onNewData(songInfo => {
			// Song information changed, so lets update the rich presence

			const activityInfo = {
				details: songInfo.title,
				state: songInfo.artist,
				largeImageKey: 'logo',
				largeImageText: songInfo.views + ' - ' + songInfo.likes
			};

			if (songInfo.isPaused) {
				// Add an idle icon to show that the song is paused
				activityInfo.smallImageKey = 'idle';
				activityInfo.smallImageText = 'idle/paused';
			} else {
				// Add the start and end time of the song
				const songStartTime = Date.now() - (songInfo.elapsedSeconds * 1000);
				activityInfo.startTimestamp = songStartTime;
				activityInfo.endTimestamp = songStartTime + (songInfo.songDuration * 1000);
			}

			rpc.setActivity(activityInfo);
		});
	});
};
