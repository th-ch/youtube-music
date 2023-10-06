import { ipcMain } from 'electron';
import { Innertube } from 'youtubei.js';

export default async () => {
  const yt = await Innertube.create();

  ipcMain.handle('audio-url', async (_, videoID: string) => {
    const info = await yt.getBasicInfo(videoID);
    return info.streaming_data?.formats[0].decipher(yt.session.player);
  });
};
