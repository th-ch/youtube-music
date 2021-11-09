const { ElementFromFile, templatePath } = require("../utils");

const { setOptions } = require("../../config/plugins");

function $(selector) { return document.querySelector(selector); }

let options;

let api;

const switchButtonDiv = ElementFromFile(
    templatePath(__dirname, "button_template.html")
);


module.exports = (_options) => {
    if (_options.forceHide) return;
    options = _options;
    document.addEventListener('apiLoaded', setup, { once: true, passive: true });
}

function setup(e) {
    api = e.detail;

    $('ytmusic-player-page').prepend(switchButtonDiv);

    $('#song-image.ytmusic-player').style.display = "block"

    if (options.hideVideo) {
        $('.video-switch-button-checkbox').checked = false;
        changeDisplay(false);
        forcePlaybackMode();
    }

    // button checked = show video
    switchButtonDiv.addEventListener('change', (e) => {
        options.hideVideo = !e.target.checked;
        changeDisplay(e.target.checked);
        setOptions("video-toggle", options);
    })

    $('video').addEventListener('srcChanged', videoStarted);

    observeThumbnail();
}

function changeDisplay(showVideo) {
    if (!showVideo) {
        $('video').style.top = "0";
        $('ytmusic-player').style.margin = "auto 0px";
        $('ytmusic-player').setAttribute('playback-mode', "ATV_PREFERRED");
    }

    showVideo ?
        $('#song-video.ytmusic-player').style.display = "unset" :
        $('#song-video.ytmusic-player').style.display = "none";
}

function videoStarted() {
    if (api.getPlayerResponse().videoDetails.musicVideoType === 'MUSIC_VIDEO_TYPE_OMV') { // or `$('#player').videoMode_`
        forceThumbnail($('#song-image img'));
        switchButtonDiv.style.display = "initial";
        if (!options.hideVideo && $('#song-video.ytmusic-player').style.display === "none") {
            changeDisplay(true);
        }
    } else {
        changeDisplay(false);
        switchButtonDiv.style.display = "none";
    }
}

// on load, after a delay, the page overrides the playback-mode to 'OMV_PREFERRED' which causes weird aspect ratio in the image container
// this function fix the problem by overriding that override :)
function forcePlaybackMode() {
    const playbackModeObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'playback-mode' && mutation.target.getAttribute('playback-mode') !== "ATV_PREFERRED") {
                playbackModeObserver.disconnect();
                mutation.target.setAttribute('playback-mode', "ATV_PREFERRED");
            }
        });
    });
    playbackModeObserver.observe($('ytmusic-player'), { attributeFilter: ["playback-mode"] })
}

function observeThumbnail() {
    const playbackModeObserver = new MutationObserver(mutations => {
        if (!$('#player').videoMode_) return;

        mutations.forEach(mutation => {
            if (!mutation.target.src.startsWith('data:')) return;
            forceThumbnail(mutation.target)
        });
    });
    playbackModeObserver.observe($('#song-image img'), { attributeFilter: ["src"] })
}

function forceThumbnail(img) {
    const thumbnails = $('#movie_player').getPlayerResponse()?.videoDetails?.thumbnail?.thumbnails;
    if (thumbnails && thumbnails.length > 0) {
        img.src = thumbnails[thumbnails.length - 1].url;
    }
}
