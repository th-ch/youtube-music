import { BrowserWindow, ipcMain } from 'electron';
import is from 'electron-is';

import { sortSegments } from './segments';

import { SkipSegment } from './types';

import defaultConfig from '../../config/defaults';
import { GetPlayerResponse } from '../../types/get-player-response';

import type { ConfigType } from '../../config/dynamic';

let videoID: string;

export default (win: BrowserWindow, options: ConfigType<'sponsorblock'>) => {
  const { apiURL, categories } = {
    ...defaultConfig.plugins.sponsorblock,
    ...options,
  };

  ipcMain.on('video-src-changed', async (_, data: string) => {
    videoID = (JSON.parse(data) as GetPlayerResponse)?.videoDetails?.videoId;
    const segments = await fetchSegments(apiURL, categories);
    win.webContents.send('sponsorblock-skip', segments);
  });
};

const fetchSegments = async (apiURL: string, categories: string[]) => {
  const sponsorBlockURL = `${apiURL}/api/skipSegments?videoID=${videoID}&categories=${JSON.stringify(
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
