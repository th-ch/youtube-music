const { ipcRenderer } = require("electron");

let video = document.querySelector("video");

module.exports = () => {
    ipcRenderer.on("playPause", (_e, toPlay) => playPause(toPlay));
};
module.exports.playPause = playPause;

function playPause(toPlay = undefined) {
    if (!checkVideo()) return;
    
    switch(toPlay) {
        case undefined: 
            video.paused ? play() : pause();
            break;
        case true:
            play(); 
            break;
        case false:
            pause();
    }

    function play() {
        video.play();
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
        if (!video) {
            return false;
        }
    } return true;
}
