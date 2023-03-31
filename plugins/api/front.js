const { ipcRenderer } = require('electron');

module.exports = () => {
    let currentStatus

    function getLikeStatus(currentVideoId = document.querySelector('#movie_player')?.getPlayerResponse()?.videoDetails?.videoId) {
        const playerBar = document.querySelector("ytmusic-player-bar");
        const likedVideos = playerBar?.getState()?.likeStatus?.videos;
        if (likedVideos) {
            for (const [id, status] of Object.entries(likedVideos)) {
                if (id === currentVideoId) {
                    return status;
                }
            }
        }
        return playerBar?.__data?.likeButtonRenderer_?.likeStatus;
    }

    const loop = () => {
        if (currentStatus !== getLikeStatus()) ipcRenderer.send('api-like-button-status', getLikeStatus())
        currentStatus = getLikeStatus()
        setTimeout(loop, 100)
    }

    loop()
}