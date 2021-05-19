const getSongInfo = require("../../providers/song-info");
const { ipcMain } = require('electron')
const ChromecastAPI = require('chromecast-api');
const { setOptions } = require("../../config/plugins");

let client;
let deviceList = [];

let registerCallback;

let win;

let options;

module.exports = (winImport, initialOptions) => {
    win = winImport;
    options = initialOptions;
    registerCallback = getSongInfo(win);

    client = new ChromecastAPI();

    client.on('device', (device) => {
        if (!deviceList.includes(device.name)) {
            registerDevice(device);
        }
    });
    ipcMain.on('volume-change', (_, v) => setVolume(v));
    ipcMain.on('seeked-to', (_, s) => seekTo(s));
};

function setVolume(volume) {
    if (!options.syncVolume) return;

    for (const device of client.devices) {
        device.setVolume(volume);
    }
}

function seekTo(seconds, device = null) {
    if (device) {
        device.seekTo(seconds);
    } else {
        win.webContents.send("log", `Seeking to "${seconds}" seconds`);
        for (const device_ of client.devices) {
            device_.seekTo(seconds);
        }
    }
}

async function getTime() {
    return win.webContents.executeJavaScript(`document.querySelector("video").currentTime`);
}

function registerDevice(device) {
    deviceList.push(device.name);

    device.on('status', async (status) => {
        win.webContents.send("log", JSON.stringify(status, null, "\t"));
        if (status.playerState === "PLAYING") {
            if (options.syncChromecastTime) {
                const currentTime = await getTime();
                const timeDiff = Math.abs(status.currentTime - currentTime);
                if (timeDiff > 1) {
                    win.webContents.send("log", `Time difference = ${timeDiff}, Setting Chromecast to "${currentTime}" seconds`);
                    seekTo(currentTime, device);
                }
            } else if (options.syncAppTime) {
                win.webContents.send("setPlaybackTime", status.currentTime);
            }
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
            isPaused = songInfo.isPaused;
            device.play(transformURL(songInfo.url));

        } else if (isPaused !== songInfo.isPaused) { //paused status changed
            isPaused = songInfo.isPaused;
            isPaused ?
                device.pause() :
                device.resume();
        }
    });
}

function transformURL(url) {// will not be needed after https://github.com/alxhotel/chromecast-api/pull/69
    const videoId = url.match(/http(?:s?):\/\/(?:www\.)?(?:music\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/);
    return "https://youtube.com/watch?v=" + (videoId.length > 1 ? videoId[1] : "dQw4w9WgXcQ");
}

function setOption(value, ...keys) {
    for (const key of keys) {
        if (typeof key === "string") {
            options[key] = value;
        } else if (key.name && key.value){
            options[key.name] = key.value;
        }
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
