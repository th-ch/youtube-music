const { ipcRenderer } = require('electron');

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const f$ = (s, ns) => s.querySelector(ns);
const f$$ = (s, ns) => Array.from(s.querySelectorAll(ns));

module.exports = (options) => {
	ipcRenderer.on(
		'get-player-queue',

		async (event, uuid) => {
			console.warn(uuid); // Prints 'whoooooooh!'

			const songs = $$('.ytmusic-tab-renderer ytmusic-player-queue-item');
			const queue = songs.filter((x) =>
				['primary-renderer', 'contents'].includes(x.parentElement.id)
			);
			//const data_without_not_rendered = queue.filter(
			//	(song) => !f$(song, '.thumbnail img').src.startsWith('data')
			//);
			const data = queue.map((song) => {
				title = f$(song, '.song-title').title;
				thumbnail = f$(song, '.thumbnail img').src;
				author = f$(song, '.byline').title;
				duration = f$(song, '.duration').title;
				selected = song.playButtonState != 'default';

				return { title, thumbnail, author, duration, selected };
			});
			ipcRenderer.send('response-uuid', uuid, data);
		}
	);
};
