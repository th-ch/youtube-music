const { ipcRenderer } = require('electron');

const sendVolume = (volume) => ipcRenderer.send('volume-change', volume);
const sendTime = (seconds) => ipcRenderer.send('seeked-to', seconds);

module.exports = function checkVideoLoaded() {
    const video = document.querySelector("video");
    video ? setup(video) : setTimeout(checkVideoLoaded, 500);
}

function setup(video) {

    sendVolume(video.volume);

    video.addEventListener('volumechange', e => sendVolume(
        e.target.muted ? 0 : e.target.volume),
        { passive: true });

    video.addEventListener('seeking', e => sendTime(e.target.currentTime), { passive: true });
}
