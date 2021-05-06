const { ipcRenderer } = require("electron");

let videoStream;
module.exports = () => {
    videoStream = document.querySelector(".video-stream");

    ipcRenderer.on("playPause", () => {
        if (!videoStream) {
            videoStream = document.querySelector(".video-stream");
        }

        if (videoStream.paused) {
            videoStream.play();
        } else {
            videoStream.yns_pause();
        }
    });
}