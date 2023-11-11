import is from 'electron-is';

import { sortSegments } from './segments';

import { SkipSegment } from './types';

import builder from './index';

import type { GetPlayerResponse } from '../../types/get-player-response';

const fetchSegments = async (apiURL: string, categories: string[], videoId: string) => {
  const sponsorBlockURL = `${apiURL}/api/skipSegments?videoID=${videoId}&categories=${JSON.stringify(
    categories,
  )}`;
  try {
    const resp = await fetch(sponsorBlockURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'follow',
    });
    if (resp.status !== 200) {
      return [];
    }

    const segments = await resp.json() as SkipSegment[];
    return sortSegments(
      segments.map((submission) => submission.segment),
    );
  } catch (error) {
    if (is.dev()) {
      console.log('error on sponsorblock request:', error);
    }

    return [];
  }
};

export default builder.createMain(({ getConfig, on, send }) => ({
  async onLoad() {
    const config = await getConfig();

    const { apiURL, categories } = config;

    on('video-src-changed', async (_, data: GetPlayerResponse) => {
      const segments = await fetchSegments(apiURL, categories, data?.videoDetails?.videoId);
      send('sponsorblock-skip', segments);
    });
  }
}));
