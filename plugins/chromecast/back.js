const registerCallback = require('../../providers/song-info');

const ChromecastAPI = require('chromecast-api') 

module.exports = () => {
    const client = new ChromecastAPI()

    client.on('device', registerDevice);
};

function registerDevice(device) {
    let currentUrl;
    let isPaused;

    registerCallback(songInfo => {
        if (!songInfo?.title) {
            return;
        } 
        if (currentUrl !== songInfo.url) { //new song
            currentUrl = songInfo.url;
            isPaused = songInfo.isPaused;

            device.play(transformURL(songInfo.url), function (err) {
                if (!err) console.log(`Playing in your chromecast: "${songInfo.title}"`)
            });

        } else if (isPaused !== songInfo.isPaused ) { //paused status changed
            isPaused = songInfo.isPaused;
            isPaused ?
                device.pause() :
                device.resume();
        }
	});
}

function transformURL(url) {// will not be needed after https://github.com/alxhotel/chromecast-api/pull/69
    const videoId = url.match(/http(?:s?):\/\/(?:www\.)?(?:music\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/);
    return videoId.length > 1 ? videoId[1] : "dQw4w9WgXcQ";
}
