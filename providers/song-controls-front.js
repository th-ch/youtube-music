const { ipcRenderer } = require("electron");

let video = document.querySelector("video");

module.exports = () => {
    ipcRenderer.on("playPause", (_e, toPlay) => playPause(toPlay));
};
module.exports.playPause = playPause;

function playPause(toPlay = undefined) {
    if (!checkVideo()) return;

    switch (toPlay) {
        case true:
            video.play();
            break;
        case false:
            pause();
            break;
        default: //usually undefined
            video.paused ? video.play() : pause();
    }

    function pause() {
        video.yns_pause ?
            video.yns_pause() :
            video.pause();
    }
}

function checkVideo() {
    if (!video) {
        video = document.querySelector("video");
    }

    return !!video;
}
