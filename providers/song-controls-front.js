const { ipcRenderer } = require("electron");

let videoStream = document.querySelector(".video-stream");
module.exports = () => {
    ipcRenderer.on("playPause", () => {
        if (!videoStream) {
            videoStream = document.querySelector(".video-stream");
        }

        if (videoStream.paused) {
            videoStream.play();
        } else {
            if (videoStream.yns_pause) {
                videoStream.yns_pause();
            } else {
                videoStream.pause();
            }
        }
    });
};
