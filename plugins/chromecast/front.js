const { ipcRenderer } = require('electron');

const { playPause } = require("../../providers/song-controls-front");

const sendVolume = (volume) => ipcRenderer.send('volume-change', volume);
const sendTime = (seconds) => ipcRenderer.send('seeked-to', seconds);

module.exports = function checkVideoLoaded() {
    const video = document.querySelector("video");
    video ? setup(video) : setTimeout(checkVideoLoaded, 500);
}

function setup(video) {

    sendVolume(video.volume);

    video.addEventListener('volumechange', e => sendVolume(e.target.volume));

    video.addEventListener('seeking', e => sendTime(e.target.currentTime)); //or 'seeked'

    ipcRenderer.on("setPlaybackTime", seconds => {
        const timeDiff = Math.abs(video.currentTime - seconds);
        console.log(`Time difference = ${timeDiff}, Setting App Video to "${seconds}" seconds`);

        playPause();
        video.currentTime = seconds;
        playPause();
    })
}
