const registerCallback = require("../../providers/song-info");
const getSongControls = require('../../providers/song-controls');

const { ipcMain } = require('electron')
const ChromecastAPI = require('chromecast-api');
const { setOptions } = require("../../config/plugins");

let client;
let deviceList = [];

let play, pause;

let options;

module.exports = (win, initialOptions) => {
    const { _play, _pause } = getSongControls(win);
    play = _play; pause = _pause;

    options = initialOptions;

    client = new ChromecastAPI();

    client.on('device', (device) => {
        if (!deviceList.includes(device.name)) {
            registerDevice(device);
        }
    });
    ipcMain.on('volume-change', (_, v) => setVolume(v));
    ipcMain.on('seeked-to', (_, s) => seekTo(s + 1.5));
};

function setVolume(volume) {
    if (options.syncVolume) {
        for (const device of client.devices) {
            device.setVolume(volume);
        }
    }
}

function seekTo(seconds) {
    if (options.syncSeek) {
        for (const device of client.devices) {
            device.seekTo(seconds);
        }
    }
}

function registerDevice(device) {
    deviceList.push(device.name);
    let currentStatus;
    device.on('status', async (status) => {
        currentStatus = status.playerState;
        if (options.syncStartTime) {
            currentStatus === "PLAYING" ? play() : pause();
        }
    })

    let currentUrl;
    let isPaused;
    registerCallback(songInfo => {
        if (!songInfo?.title) {
            return;
        }
        if (currentUrl !== songInfo.url) { //new song
            currentUrl = songInfo.url;
            if (options.syncStartTime) {
                isPaused = true;
                pause();
            } else {
                isPaused = songInfo.isPaused;
            }
            device.play(transformURL(songInfo.url));

        } else if (isPaused !== songInfo.isPaused) { //paused status changed
            isPaused = songInfo.isPaused;
            if (isPaused && currentStatus === "PLAYING") {
                device.pause();
            } else {
                device.resume();
            }
        }
    });
}

// will not be needed after https://github.com/alxhotel/chromecast-api/pull/69 (chromecastAPI v0.3.5)
function transformURL(url) {
    const videoId = url.match(/(?:http(?:s?):\/\/)?(?:www\.)?(?:music\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)/);
    // videoId[1] should always be valid since regex should always be valid - rickroll video should never happen :)
    return "https://youtube.com/watch?v=" + (videoId.length > 1 ? videoId[1] : "dQw4w9WgXcQ");
}

module.exports.setOption = (value, ...keys) => {
    for (const key of keys) {
        options[key] = value;
    }
    setOptions("chromecast", options);
};

module.exports.menuCheck = (options_) => {
    if (!options) options = options_;
}

module.exports.refreshChromecast = () => {
    if (client) client.update();
}
