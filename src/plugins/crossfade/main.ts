import { Innertube } from 'youtubei.js';

import builder from './index';

import { getNetFetchAsFetch } from '../utils/main';

export default builder.createMain(({ handle }) => ({
  async onLoad() {
    const yt = await Innertube.create({
      fetch: getNetFetchAsFetch(),
    });

    handle('audio-url', async (_, videoID: string) => {
      const info = await yt.getBasicInfo(videoID);
      return info.streaming_data?.formats[0].decipher(yt.session.player);
    });
  }
}));
