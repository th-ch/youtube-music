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
            videoStream.yns_pause ?
                videoStream.yns_pause() :
                videoStream.pause();
        }
    });
};
