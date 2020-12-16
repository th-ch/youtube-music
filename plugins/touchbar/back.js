const {
	TouchBar, nativeImage
} = require('electron');
const {
	TouchBarButton,
	TouchBarLabel,
	TouchBarSpacer,
	TouchBarSegmentedControl,
	TouchBarScrubber
} = TouchBar;
const fetch = require('node-fetch');

// This selects the song title
const titleSelector = '.title.style-scope.ytmusic-player-bar';

// This selects the song image
const imageSelector = '#layout > ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar > img';

// These keys will be used to go backwards, pause, skip songs, like songs, dislike songs
const keys = ['k', 'space', 'j', '+', '_'];

const presskey = (window, key) => {
	window.webContents.sendInputEvent({
		type: 'keydown',
		keyCode: key
	});
};

// Grab the title using the selector
const getTitle = win => {
	return win.webContents.executeJavaScript(
		'document.querySelector(\'' + titleSelector + '\').innerText'
	).catch(error => {
		console.log(error);
	});
};

// Grab the image src using the selector
const getImage = win => {
	return win.webContents.executeJavaScript(
		'document.querySelector(\'' + imageSelector + '\').src'
	).catch(error => {
		console.log(error);
	});
};

module.exports = win => {
	// Songtitle label
	const songTitle = new TouchBarLabel({
		label: ''
	});

	// This will store the song image once available
	const songImage = {};

	// The song control buttons (keys to press are in the same order)
	const buttons = new TouchBarSegmentedControl({
		mode: 'buttons',
		segments: [
			new TouchBarButton({
				label: '⏮'
			}),
			new TouchBarButton({
				label: '⏯️'
			}),
			new TouchBarButton({
				label: '⏭'
			}),
			new TouchBarButton({
				label: '👍'
			}),
			new TouchBarButton({
				label: '👎'
			})
		],
		change: i => presskey(win, keys[i])
	});

	// This is the touchbar object, this combines everything with proper layout
	const touchBar = new TouchBar({
		items: [
			new TouchBarScrubber({
				items: [songImage, songTitle],
				continuous: false
			}),
			new TouchBarSpacer({
				size: 'flexible'
			}),
			buttons
		]
	});

	// If the page title changes, update touchbar and song title
	win.on('page-title-updated', async () => {
		// Set the song title
		songTitle.label = await getTitle(win);

		// Get image source
		const imageSrc = await getImage(win);

		// Fetch and set song image
		await fetch(imageSrc)
			.then(response => response.buffer())
			.then(data => {
				songImage.icon = nativeImage.createFromBuffer(data).resize({height: 23});
			});

		win.setTouchBar(touchBar);
	});
};
