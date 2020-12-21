const {nativeImage} = require('electron');
const fetch = require('node-fetch');

// This selects the song title
const titleSelector = '.title.style-scope.ytmusic-player-bar';

// This selects the song image
const imageSelector = '#layout > ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar > img';

// This selects the song subinfo, this includes artist, views, likes
const subInfoSelector = '#layout > ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar > div.content-info-wrapper.style-scope.ytmusic-player-bar > span';

// This is used for to control the songs
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
const getImageSrc = win => {
	return win.webContents.executeJavaScript(
		'document.querySelector(\'' + imageSelector + '\').src'
	).catch(error => {
		console.log(error);
	});
};

// Grab the subinfo using the selector
const getSubInfo = async win => {
	// Get innerText of subinfo element
	const subInfoString = await win.webContents.executeJavaScript(
		'document.querySelector("' + subInfoSelector + '").innerText');

	// Split and clean the string
	const splittedSubInfo = subInfoString.replaceAll('\n', '').split(' • ');

	// Make sure we always return 3 elements in the aray
	const subInfo = [];
	for (let i = 0; i < 3; i++) {
		// Fill array with empty string if not defined
		subInfo.push(splittedSubInfo[i] || '');
	}

	return subInfo;
};

// Grab the native image using the src
const getImage = async src => {
	const result = await fetch(src);
	const buffer = await result.buffer();
	return nativeImage.createFromBuffer(buffer);
};

const getPausedStatus = async win => {
	const title = await win.webContents.executeJavaScript('document.title');
	return !title.includes('-');
};

// This variable will be filled with the callbacks once they register
const callbacks = [];

module.exports = async win => {
	// Fill songInfo with empty values
	global.songInfo = {
		title: '',
		artist: '',
		views: '',
		likes: '',
		imageSrc: '',
		image: null,
		isPaused: true
	};
	// The song control funcions
	global.songControls = {
		previous: () => presskey(win, 'k'),
		next: () => presskey(win, 'j'),
		pause: () => presskey(win, 'space'),
		like: () => presskey(win, '_'),
		dislike: () => presskey(win, '+')
	};

	// This function will allow plugins to register callback that will be triggered when data changes
	global.songInfo.onNewData = callback => {
		callbacks.push(callback);
	};

	win.on('page-title-updated', async () => {
		// Save the old title temporarily
		const oldTitle = global.songInfo.title;
		// Get and set the new data
		global.songInfo.title = await getTitle(win);
		global.songInfo.isPaused = await getPausedStatus(win);

		// If title changed then we do need to update other info
		if (oldTitle !== global.songInfo.title) {
			const subInfo = await getSubInfo(win);
			global.songInfo.artist = subInfo[0];
			global.songInfo.views = subInfo[1];
			global.songInfo.likes = subInfo[2];
			global.songInfo.imageSrc = await getImageSrc(win);
			global.songInfo.image = await getImage(global.songInfo.imageSrc);
		}

		// Trigger the callbacks
		callbacks.forEach(c => {
			c(global.songInfo);
		});
	});
};
