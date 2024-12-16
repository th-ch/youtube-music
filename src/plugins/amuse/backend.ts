import http from 'node:http';

import { SongInfo } from "@/providers/song-info";
import { getSongInfo } from "@/providers/song-info-front";
import { createBackend } from "@/utils";
import { t } from "i18next";
import { AmuseSongInfo } from "./types";

const amusePort = 9863;

function formatSongInfo(info: SongInfo) {

  let formattedSongInfo: AmuseSongInfo = {
    player: {
      hasSong: info.artist && info.title ? true : false,
      isPaused: info.isPaused ?? false,
      seekbarCurrentPosition: info.elapsedSeconds ?? 0
    },
    track: {
      duration: info.songDuration,
      title: info.title,
      author: info.artist,
      cover: info.imageSrc ?? "",
      url: info.url ?? "",
      id: info.videoId,
      isAdvertisement: false,
    }
  }
  return formattedSongInfo;
}

export default createBackend({
  start() {
    const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {

      // Likely necessary due to CORS
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Content-Type', 'application/json');

      if (req.url === '/') {
        res.writeHead(200)
        res.end(t('plugins.amuse.response.query'))
      }

      if (req.url === '/query' || req.url === '/api') {
        res.end(JSON.stringify(formatSongInfo(getSongInfo())));
      }
    });

    server.listen(amusePort, () => {
      console.log(`Amuse API server started @ http://localhost:${amusePort}`);
    });
  }
});
