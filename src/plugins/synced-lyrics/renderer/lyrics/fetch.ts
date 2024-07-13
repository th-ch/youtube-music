import { SongInfo } from "@/providers/song-info";
import { LineLyrics } from "../..";
import { syncedLyricList, config } from "../renderer";
import { net } from "electron";
import { getNetFetchAsFetch } from "@/plugins/utils/main/fetch";

export let hadSecondAttempt = false;
export let foundPlainTextLyrics = false;

export type SongData = {
  title: string;
  artist: string;
  album: string;
  songDuration: number;
}
    
export const extractTimeAndText = (line: string, index: number): LineLyrics|null => {
  const match = /\[(\d+):(\d+)\.(\d+)\](.+)/.exec(line);
  if (!match) return null;

  const minutes = parseInt(match[1]);
  const seconds = parseInt(match[2]);
  const milliseconds = parseInt(match[3]);
  const text = match[4] === ' ' ? config.defaultTextString : match[4].slice(1);
  
  const time = `${minutes}:${seconds}:${milliseconds}`;
  const timeInMs = (minutes * 60 * 1000) + (seconds * 1000) + milliseconds;

  return {
    index,
    time,
    timeInMs,
    text,
    status: 'upcoming',
  } as LineLyrics;
}

export const makeLyricsRequest = async (extractedSongInfo: SongInfo): Promise<Array<LineLyrics> | null>  => {
  const songData = {
    title: `${extractedSongInfo.title}`,
    artist: `${extractedSongInfo.artist}`,
    album: extractedSongInfo.album ? `${extractedSongInfo.album}` : undefined,
    songDuration: extractedSongInfo.songDuration
  } as SongData;
  
  return await getLyricsList(songData);
}
    
export const getLyricsList = async (songData: SongData): Promise<Array<LineLyrics> | null> => {
  let url =  `https://lrclib.net/api/search?artist_name=${encodeURIComponent(songData.artist)}&track_name=${encodeURIComponent(songData.title)}`
  if (songData.album !== undefined) url += `&album_name=${encodeURIComponent(songData.album)}`;

  const response = await fetch(url);
  if (!response.ok)
  return null;

  return await response.json().then(async (data: any) => { 
    let dataIndex: number = 0;
    if (!data.length && config.showLyricsEvenIfInexact) { //If no lyrics are found, try again with a different search query
      hadSecondAttempt = true;
      const secondResponse = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(songData.title)}`);
      if (!secondResponse.ok) return null;
      data = await secondResponse.json();
    }

    else if (!data.length) 
      return null;

    let songsWithMatchingArtist = data.filter((song: any) => songData.artist.toLowerCase().includes(song.artistName.toLowerCase()) && song.syncedLyrics); //Lowercase to avoid case sensitivity from API
    if (!songsWithMatchingArtist.length) return null;
    dataIndex = 0;
    if (songsWithMatchingArtist.length > 1) {
      for (let i = 0; i < songsWithMatchingArtist.length; i++) {
        if (Math.abs(songsWithMatchingArtist[i].duration - songData.songDuration) < Math.abs(songsWithMatchingArtist[dataIndex].duration - songData.songDuration)) {
          dataIndex = i;
        }
      }
    }

    data = songsWithMatchingArtist;
    if (Math.abs(data[dataIndex].duration - songData.songDuration) > 5) return null;

    let raw = data[dataIndex].syncedLyrics.split('\n') //Separate the lyrics into lines
    raw.unshift('[0:0.0] ') //Add a blank line at the beginning
    raw.forEach((line: string, index: number) => {
      const syncedLyrics = extractTimeAndText(line, index);
      if (syncedLyrics !== null) syncedLyricList.push(syncedLyrics);
    });

    //await getGeniusLyrics(songData);
    //getGeniusLyrics(`${songData.artist} ${songData.title}`);
    return syncedLyricList;
  });
};

//const getGeniusLyrics = async (songData: SongData)/*: Promise<string | null> */ => {
  //const url = `https://api.genius.com/search?q=${encodeURIComponent(songData.title)} ${encodeURIComponent(songData.artist)}&per_page=5`;
  //const url = `https://genius.com/api/search/multi?per_page=5&q=${encodeURIComponent(songData.title)} ${encodeURIComponent(songData.artist)}`
/*   try {
    const response = await net.fetch(
      `https://genius.com/api/search/multi?per_page=5&q=${encodeURIComponent(`${songData.artist} ${songData.title}`)}`,
    );
    console.log("response", response);
    if (!response.ok) return null;

    return await response.json().then(async (data: any) => {
      if (!data.response.hits.length) return null;
      const responseSections = data.response.sections;
      //target only coponents that have "type": "songs"
      const songs = responseSections.filter((section: any) => section.type === "songs");
      if (!songs.length) return null;
      const songUrl = songs[0].hits[0].result.url;
      console.log(songUrl)

      const lyricsResponse = await fetch(songUrl);
      if (!lyricsResponse.ok) return null;
      //find all divs with attribute "data-lyrics-container"
      const lyricsHtml = await lyricsResponse.text();
      console.log(lyricsHtml)
      const parser = new DOMParser();
      const doc = parser.parseFromString(lyricsHtml, 'text/html');
      const lyrics = doc.querySelectorAll('div[data-lyrics-container]');
      if (!lyrics.length) return null;
      const lyricsText = lyrics[0].textContent;

      console.warn(lyricsText);
      return lyricsText;
    });
  
  } catch (error) {
    console.error("Error fetching lyrics from Genius", error);
  } */

  
//}

/* const getGeniusLyrics = async (queryString: string) => {
  const response = await net.fetch(
    `https://genius.com/api/search/multi?per_page=5&q=${encodeURIComponent(
      queryString,
    )}`,
  );
  if (!response.ok) {
    return null;
  }
  console.log("response", response);

  // Fetch the first URL with the api, giving a collection of song results.
  // Pick the first song, parsing the json given by the API.
 
  // const info = (await response.json());
  // const url = info?.response?.sections?.find(
  //   (section) => section.type === 'song',
  // )?.hits[0]?.result?.url;

  // if (url) {
  //   return await getLyrics(url);
  // } else {
  //   return null;
  // }
}; */