const { ipcRenderer } = require("electron");

let video = document.querySelector("video");

function playPause() {
    if (!video) {
        video = document.querySelector(".video-stream");
    }

    if (video.paused) {
        video.play();
    } else {
        video.yns_pause ?
            video.yns_pause() :
            video.pause();
    }
}

module.exports = () => {
    ipcRenderer.on("playPause", playPause);
};

module.exports.playPause = playPause;
