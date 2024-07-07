import { LineLyrics, PlayPauseEvent } from "../..";
import { config, secToMilisec, syncedLyricList } from "../renderer";
import { styleLyrics } from "./insert";

let currentTime: number = 0;
let currentLyric: LineLyrics | null = null;
let nextLyric: LineLyrics | null = null;
let interval: NodeJS.Timeout | null = null;

export const createProgressEvents = (on: Function) => {
  on('synced-lyrics:paused', (data: PlayPauseEvent) => {
      if (data.isPaused) 
          clearInterval(interval!);
  });

  on('synced-lyrics:setTime', (t: number) => {
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

  if (nextLyric && time >= nextLyric.timeInMs) {
    currentLyric.status = 'previous';
    currentLyric = nextLyric;
    nextLyric = syncedLyricList[currentLyric.index + 1];
    currentLyric.status = 'current';
    styleLyrics(currentLyric);
    return;
  }

  //if time is before curent lyric time, replace the current lyric with the lyric associated with the acutal time
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