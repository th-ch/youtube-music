import { styleLyrics } from './insert';

import { LineLyrics, PlayPauseEvent } from '../..';
import { config, lyrics, secToMilisec, songWithLyrics, syncedLyricList } from '../renderer';

let currentTime: number = 0;
let currentLyric: LineLyrics | null = null;
let nextLyric: LineLyrics | null = null;
export let interval: NodeJS.Timeout | null = null;

export const resetAllVariables = () => {
  currentLyric = null;
  nextLyric = null;
  currentTime = 0;
  clearInterval(interval!);
}

export const createProgressEvents = (on: Function) => {
  on('synced-lyrics:paused', (data: PlayPauseEvent) => {
      if (data.isPaused)
          clearInterval(interval!);
  });

  on('synced-lyrics:setTime', (t: number) => {
    if(!lyrics && !songWithLyrics) return;
    if (config.preciseTiming) {
      currentTime = secToMilisec(t);
      clearInterval(interval!);
      interval = setInterval(() => {
        currentTime += 10;
        changeActualLyric(currentTime);
      }, 10);
    }
    else {
        clearInterval(interval!);
        currentTime = secToMilisec(t);
        changeActualLyric(currentTime);
    }
  });
}

export const changeActualLyric = (time: number): LineLyrics|void => {
  if (!syncedLyricList.length) return;

  if (!currentLyric) {
    currentLyric = syncedLyricList[0];
    nextLyric = syncedLyricList[1];
    currentLyric.status = 'current';
    styleLyrics(currentLyric);
    return;
  }

  if (nextLyric && time > nextLyric.timeInMs) {
    for (let i = 0; i < syncedLyricList.length; i++) {
      syncedLyricList[i].status = 'previous';

      if (syncedLyricList[i].timeInMs > time) {
        clearInterval(interval!);
        syncedLyricList[i - 1].status = 'current';
        syncedLyricList[i].status = 'upcoming';
        currentLyric = syncedLyricList[i - 1];
        nextLyric = syncedLyricList[i] ? syncedLyricList[i] : null;
        styleLyrics(currentLyric);
        return;
      }
    }
  }

  //I check 300ms before the current lyric time to avoid lyrics to overlap and flicker
  if (time < currentLyric.timeInMs - 300) {
    for (let i = syncedLyricList.length - 1; i >= 0; i--) {
      syncedLyricList[i].status = 'upcoming';

      if (syncedLyricList[i].timeInMs < time) {
        clearInterval(interval!);
        currentLyric.status = 'previous';
        currentLyric = syncedLyricList[i];
        nextLyric = syncedLyricList[i + 1];
        currentLyric.status = 'current';
        styleLyrics(currentLyric);
        return;
      }
    }
  }

}
