import { SongInfo } from "@/providers/song-info";
import { LineLyrics } from "../..";
import { syncedLyricList, config } from "../renderer";

export let hadSecondAttempt = false;
    
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
    const songTitle = `${extractedSongInfo.title}`;
    const songArtist = `${extractedSongInfo.artist}`;
    const songAlbum = extractedSongInfo.album ? `${extractedSongInfo.album}` : undefined;
    const songDuration = extractedSongInfo.songDuration;
    
    return await getLyricsList(songTitle, songArtist, songAlbum, songDuration);
}
    
export const getLyricsList = async (songTitle: string, songArtist: string, songAlbum: string|undefined, songDuration: number): Promise<Array<LineLyrics> | null> => {
    let url =  `https://lrclib.net/api/search?artist_name=${encodeURIComponent(songArtist)}&track_name=${encodeURIComponent(songTitle)}`
    if (songAlbum !== undefined) url += `&album_name=${encodeURIComponent(songAlbum)}`;

    const response = await fetch(url);
    if (!response.ok)
    return null;

    return await response.json().then(async (data: any) => { 
    let dataIndex: number = 0;
    if (!data.length && config.showLyricsEvenIfInexact) { //If no lyrics are found, try again with a different search query
        hadSecondAttempt = true;
        const secondResponse = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(songTitle)}`);
        if (!secondResponse.ok) return null;
        console.log('Second attempt');
        data = await secondResponse.json();
    }
    else if (!data.length) 
        return null;

    let songsWithMatchingArtist = data.filter((song: any) => songArtist.toLowerCase().includes(song.artistName.toLowerCase()) && song.syncedLyrics); //Lowercase to avoid case sensitivity from API
    console.log('song with matching artists', songsWithMatchingArtist);
    if (!songsWithMatchingArtist.length) return null;
    dataIndex = 0;
    if (songsWithMatchingArtist.length > 1) {
        for (let i = 0; i < songsWithMatchingArtist.length; i++) {
        if (Math.abs(songsWithMatchingArtist[i].duration - songDuration) < Math.abs(songsWithMatchingArtist[dataIndex].duration - songDuration)) {
            dataIndex = i;
        }
        }
    }

    data = songsWithMatchingArtist;

    console.log(data)
    console.log(dataIndex, data[dataIndex]);
    if (Math.abs(data[dataIndex].duration - songDuration) > 5) return null;

    let raw = data[dataIndex].syncedLyrics.split('\n') //Separate the lyrics into lines
    raw.unshift('[0:0.0] ') //Add a blank line at the beginning
    raw.forEach((line: string, index: number) => {
        const syncedLyrics = extractTimeAndText(line, index);
        if (syncedLyrics !== null) syncedLyricList.push(syncedLyrics);
    });

    return syncedLyricList;
    });
};