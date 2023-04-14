const axios = require("axios");

const { setOptions, getOptions } = require("../../config/plugins");
const registerCallback = require("../../providers/song-info");
const getSongControls = require("../../providers/song-controls");
const { ipcMain } = require("electron");

module.exports = (win) => {
    win.once("ready-to-show", () => {
        const options = getOptions("api")
        if (!options.key) {
            axios.get("https://youtube-music-api.zohan.tech/api/key")
                .then(response => {
                    options.key = response.data.key;
                    setOptions("api", options);
                })
        }

        const post = () => {
            axios.post("https://youtube-music-api.zohan.tech/api/status", { key: getOptions("api").key, ...currentSongInfo })
                .catch(err => {
                    console.log(err.message, err.stack, currentSongInfo)
                })
        }

        let currentSongInfo
        let likeStatus = 'UNKNOWN'

        registerCallback(songInfo => {
            currentSongInfo = songInfo
            currentSongInfo.likeStatus = likeStatus
            post()
        })

        ipcMain.on('timeChanged', (_, t) => {
            if (currentSongInfo) {
                currentSongInfo.elapsedSeconds = t
                post()
            }
        })

        ipcMain.on('api-like-button-status', (_, status) => {
            likeStatus = status
            if (currentSongInfo) {
                currentSongInfo.likeStatus = likeStatus
                post()
            }
        })

        pollControls();

        async function pollControls() {
            try {
                const response = await axios.get(`https://youtube-music-api.zohan.tech/api/controls?key=${getOptions("api").key}`)
                const songControls = getSongControls(win);
                response.data.controls.forEach(control => {
                    songControls[control]();
                })
            } catch (err) {
                console.log(err.message, err.stack)
            }
            setTimeout(pollControls, 100);
        }
    })
}

module.exports.getKey = async (options) => {
    if (!options.key) {
        const response = await axios.get("https://youtube-music-api.zohan.tech/api/key");
        return response.data.key;
    }

    return options.key
}