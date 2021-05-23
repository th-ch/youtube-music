const getSongInfo = require("../../providers/song-info");
const getSongControls = require('../../providers/song-controls');

const { ipcMain } = require('electron')
const ChromecastAPI = require('chromecast-api');
const { setOptions } = require("../../config/plugins");

let client;
let deviceList = [];

let registerCallback;

let win;

let play, pause;

let options;

module.exports = (winImport, initialOptions) => {
    win = winImport;
    const { playPause } = getSongControls(win);
    play = () => playPause(true);
    pause = () => playPause(false);

    options = initialOptions;
    registerCallback = getSongInfo(win);

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
        win.webContents.send("log", status.playerState);
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

function transformURL(url) {// will not be needed after https://github.com/alxhotel/chromecast-api/pull/69
    const videoId = url.match(/http(?:s?):\/\/(?:www\.)?(?:music\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/);
    return "https://youtube.com/watch?v=" + (videoId.length > 1 ? videoId[1] : "dQw4w9WgXcQ");
}

function setOption(value, ...keys) {
    for (const key of keys) {
        options[key] = value;
    }
    setOptions("chromecast", options);
}

module.exports.setOption = setOption;

module.exports.menuCheck = (options_) => {
    if (!options) options = options_;
}

module.exports.refreshChromecast = () => {
    if (client) client.update();
}
