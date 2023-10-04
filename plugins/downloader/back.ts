import { createWriteStream, existsSync, mkdirSync, writeFileSync, } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';

import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { ClientType, Innertube, UniversalCache, Utils } from 'youtubei.js';
import is from 'electron-is';
import ytpl from 'ytpl';
// REPLACE with youtubei getplaylist https://github.com/LuanRT/YouTube.js#getplaylistid
import filenamify from 'filenamify';
import { Mutex } from 'async-mutex';
import { createFFmpeg } from '@ffmpeg.wasm/main';

import NodeID3, { TagConstants } from 'node-id3';

import PlayerErrorMessage from 'youtubei.js/dist/src/parser/classes/PlayerErrorMessage';
import { FormatOptions } from 'youtubei.js/dist/src/types/FormatUtils';

import TrackInfo from 'youtubei.js/dist/src/parser/ytmusic/TrackInfo';

import { VideoInfo } from 'youtubei.js/dist/src/parser/youtube';

import { cropMaxWidth, getFolder, presets, sendFeedback as sendFeedback_, setBadge } from './utils';

import config from './config';

import style from './style.css';

import { fetchFromGenius } from '../lyrics-genius/back';
import { isEnabled } from '../../config/plugins';
import { cleanupName, getImage, SongInfo } from '../../providers/song-info';
import { injectCSS } from '../utils';
import { cache } from '../../providers/decorators';

import type { GetPlayerResponse } from '../../types/get-player-response';


type CustomSongInfo = SongInfo & { trackId?: string };

const ffmpeg = createFFmpeg({
  log: false,
  logger() {
  }, // Console.log,
  progress() {
  }, // Console.log,
});
const ffmpegMutex = new Mutex();

let yt: Innertube;
let win: BrowserWindow;
let playingUrl: string;

const sendError = (error: Error, source?: string) => {
  win.setProgressBar(-1); // Close progress bar
  setBadge(0); // Close badge
  sendFeedback_(win); // Reset feedback

  const songNameMessage = source ? `\nin ${source}` : '';
  const cause = error.cause ? `\n\n${String(error.cause)}` : '';
  const message = `${error.toString()}${songNameMessage}${cause}`;

  console.error(message, error, error?.stack);
  dialog.showMessageBox({
    type: 'info',
    buttons: ['OK'],
    title: 'Error in download!',
    message: 'Argh! Apologies, download failed…',
    detail: message,
  });
};

export default async (win_: BrowserWindow) => {
  win = win_;
  injectCSS(win.webContents, style);

  const cookie = (await win.webContents.session.cookies.get({ url: 'https://music.youtube.com' })).map((it) =>
    it.name + '=' + it.value + ';'
  ).join('');
  yt = await Innertube.create({
    cache: new UniversalCache(false),
    cookie,
    generate_session_locally: true,
  });
  ipcMain.on('download-song', (_, url: string) => downloadSong(url));
  ipcMain.on('video-src-changed', (_, data: GetPlayerResponse) => {
    playingUrl = data.microformat.microformatDataRenderer.urlCanonical;
  });
  ipcMain.on('download-playlist-request', async (_event, url: string) =>
    downloadPlaylist(url),
  );
};

export async function downloadSong(
  url: string,
  playlistFolder: string | undefined = undefined,
  trackId: string | undefined = undefined,
  increasePlaylistProgress: (value: number) => void = () => {
  },
) {
  let resolvedName;
  try {
    await downloadSongUnsafe(
      url,
      (name: string) => resolvedName = name,
      playlistFolder,
      trackId,
      increasePlaylistProgress,
    );
  } catch (error: unknown) {
    console.log('maybe?????', error);
    sendError(error as Error, resolvedName || url);
  }
}

async function downloadSongUnsafe(
  url: string,
  setName: (name: string) => void,
  playlistFolder: string | undefined = undefined,
  trackId: string | undefined = undefined,
  increasePlaylistProgress: (value: number) => void = () => {
  },
) {
  const sendFeedback = (message: unknown, progress?: number) => {
    if (!playlistFolder) {
      sendFeedback_(win, message);
      if (progress && !isNaN(progress)) {
        win.setProgressBar(progress);
      }
    }
  };

  sendFeedback('Downloading...', 2);

  const id = getVideoId(url);
  if (typeof id !== 'string') throw new Error('Video not found');

  let info: TrackInfo | VideoInfo = await yt.music.getInfo(id);

  if (!info) {
    throw new Error('Video not found');
  }

  const metadata = getMetadata(info);
  if (metadata.album === 'N/A') {
    metadata.album = '';
  }

  metadata.trackId = trackId;

  const dir
    = playlistFolder || config.get('downloadFolder') || app.getPath('downloads');
  const name = `${metadata.artist ? `${metadata.artist} - ` : ''}${
    metadata.title
  }`;
  setName(name);

  let playabilityStatus = info.playability_status;
  let bypassedResult = null;
  if (playabilityStatus.status === 'LOGIN_REQUIRED') {
    // Try to bypass the age restriction
    bypassedResult = await getAndroidTvInfo(id);
    playabilityStatus = bypassedResult.playability_status;

    if (playabilityStatus.status === 'LOGIN_REQUIRED') {
      throw new Error(
        `[${playabilityStatus.status}] ${playabilityStatus.reason}`,
      );
    }

    info = bypassedResult;
  }

  if (playabilityStatus.status === 'UNPLAYABLE') {
    const errorScreen = playabilityStatus.error_screen as PlayerErrorMessage | null;
    throw new Error(
      `[${playabilityStatus.status}] ${errorScreen?.reason.text}: ${errorScreen?.subreason.text}`,
    );
  }

  const preset = config.get('preset') ?? 'mp3';
  let presetSetting: { extension: string; ffmpegArgs: string[] } | null = null;
  if (preset === 'opus') {
    presetSetting = presets[preset];
  }

  const filename = filenamify(`${name}.${presetSetting?.extension ?? 'mp3'}`, {
    replacement: '_',
    maxLength: 255,
  });
  const filePath = join(dir, filename);

  if (config.get('skipExisting') && existsSync(filePath)) {
    sendFeedback(null, -1);
    return;
  }

  const downloadOptions: FormatOptions = {
    type: 'audio', // Audio, video or video+audio
    quality: 'best', // Best, bestefficiency, 144p, 240p, 480p, 720p and so on.
    format: 'any', // Media container format
  };

  const format = info.chooseFormat(downloadOptions);
  const stream = await info.download(downloadOptions);

  console.info(
    `Downloading ${metadata.artist} - ${metadata.title} [${metadata.videoId}]`,
  );

  const iterableStream = Utils.streamToIterable(stream);

  if (!existsSync(dir)) {
    mkdirSync(dir);
  }

  const ffmpegArgs = config.get('ffmpegArgs');

  if (presetSetting && presetSetting?.extension !== 'mp3') {
    const file = createWriteStream(filePath);
    let downloaded = 0;
    const total: number = format.content_length ?? 1;

    for await (const chunk of iterableStream) {
      downloaded += chunk.length;
      const ratio = downloaded / total;
      const progress = Math.floor(ratio * 100);
      sendFeedback(`Download: ${progress}%`, ratio);
      increasePlaylistProgress(ratio);
      file.write(chunk);
    }

    await ffmpegWriteTags(
      filePath,
      metadata,
      presetSetting.ffmpegArgs,
      ffmpegArgs,
    );
    sendFeedback(null, -1);
  } else {
    const fileBuffer = await iterableStreamToMP3(
      iterableStream,
      metadata,
      ffmpegArgs,
      format.content_length ?? 0,
      sendFeedback,
      increasePlaylistProgress,
    );
    if (fileBuffer) {
      const buffer = await writeID3(Buffer.from(fileBuffer), metadata, sendFeedback);
      if (buffer) {
        writeFileSync(filePath, buffer);
      }
    }
  }

  sendFeedback(null, -1);
  console.info(`Done: "${filePath}"`);
}

async function iterableStreamToMP3(
  stream: AsyncGenerator<Uint8Array, void>,
  metadata: CustomSongInfo,
  ffmpegArgs: string[],
  contentLength: number,
  sendFeedback: (str: string, value?: number) => void,
  increasePlaylistProgress: (value: number) => void = () => {
  },
) {
  const chunks = [];
  let downloaded = 0;
  for await (const chunk of stream) {
    downloaded += chunk.length;
    chunks.push(chunk);
    const ratio = downloaded / contentLength;
    const progress = Math.floor(ratio * 100);
    sendFeedback(`Download: ${progress}%`, ratio);
    // 15% for download, 85% for conversion
    // This is a very rough estimate, trying to make the progress bar look nice
    increasePlaylistProgress(ratio * 0.15);
  }

  sendFeedback('Loading…', 2); // Indefinite progress bar after download

  const buffer = Buffer.concat(chunks);
  const safeVideoName = randomBytes(32).toString('hex');
  const releaseFFmpegMutex = await ffmpegMutex.acquire();

  try {
    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }

    sendFeedback('Preparing file…');
    ffmpeg.FS('writeFile', safeVideoName, buffer);

    sendFeedback('Converting…');

    ffmpeg.setProgress(({ ratio }) => {
      sendFeedback(`Converting: ${Math.floor(ratio * 100)}%`, ratio);
      increasePlaylistProgress(0.15 + (ratio * 0.85));
    });

    try {
      await ffmpeg.run(
        '-i',
        safeVideoName,
        ...ffmpegArgs,
        ...getFFmpegMetadataArgs(metadata),
        `${safeVideoName}.mp3`,
      );
    } finally {
      ffmpeg.FS('unlink', safeVideoName);
    }

    sendFeedback('Saving…');

    try {
      return ffmpeg.FS('readFile', `${safeVideoName}.mp3`);
    } finally {
      ffmpeg.FS('unlink', `${safeVideoName}.mp3`);
    }
  } catch (error: unknown) {
    console.log('maybe?', error);
    sendError(error as Error, safeVideoName);
  } finally {
    releaseFFmpegMutex();
  }
}

const getCoverBuffer = cache(async (url: string) => {
  const nativeImage = cropMaxWidth(await getImage(url));
  return nativeImage && !nativeImage.isEmpty() ? nativeImage.toPNG() : null;
});

async function writeID3(buffer: Buffer, metadata: CustomSongInfo, sendFeedback: (str: string, value?: number) => void) {
  try {
    sendFeedback('Writing ID3 tags...');
    const tags: NodeID3.Tags = {};

    // Create the metadata tags
    tags.title = metadata.title;
    tags.artist = metadata.artist;

    if (metadata.album) {
      tags.album = metadata.album;
    }

    const coverBuffer = await getCoverBuffer(metadata.imageSrc ?? '');
    if (coverBuffer) {
      tags.image = {
        mime: 'image/png',
        type: {
          id: TagConstants.AttachedPicture.PictureType.FRONT_COVER,
        },
        description: 'thumbnail',
        imageBuffer: coverBuffer,
      };
    }

    if (isEnabled('lyrics-genius')) {
      const lyrics = await fetchFromGenius(metadata);
      if (lyrics) {
        tags.unsynchronisedLyrics = {
          language: '',
          text: lyrics,
        };
      }
    }

    if (metadata.trackId) {
      tags.trackNumber = metadata.trackId;
    }

    return NodeID3.write(tags, buffer);
  } catch (error: unknown) {
    console.log('fallback', error);
    sendError(error as Error, `${metadata.artist} - ${metadata.title}`);
    return null;
  }
}

export async function downloadPlaylist(givenUrl?: string | URL) {
  try {
    givenUrl = new URL(givenUrl ?? '');
  } catch {
    return;
  }

  const playlistId
    = getPlaylistID(givenUrl)
    || getPlaylistID(new URL(win.webContents.getURL()))
    || getPlaylistID(new URL(playingUrl));

  if (!playlistId) {
    sendError(new Error('No playlist ID found'));
    return;
  }

  const sendFeedback = (message?: unknown) => sendFeedback_(win, message);

  console.log(`trying to get playlist ID: '${playlistId}'`);
  sendFeedback('Getting playlist info…');
  let playlist: ytpl.Result;
  try {
    playlist = await ytpl(playlistId, {
      limit: config.get('playlistMaxItems') || Number.POSITIVE_INFINITY,
    });
  } catch (error: unknown) {
    sendError(
      Error(`Error getting playlist info: make sure it isn't a private or "Mixed for you" playlist\n\n${String(error)}`),
    );
    return;
  }

  if (playlist.items.length === 0) {
    sendError(new Error('Playlist is empty'));
  }

  if (playlist.items.length === 1) {
    sendFeedback('Playlist has only one item, downloading it directly');
    await downloadSong(playlist.items[0].url);
    return;
  }

  const isAlbum = playlist.title.startsWith('Album - ');
  if (isAlbum) {
    playlist.title = playlist.title.slice(8);
  }

  const safePlaylistTitle = filenamify(playlist.title, { replacement: ' ' });

  const folder = getFolder(config.get('downloadFolder') ?? '');
  const playlistFolder = join(folder, safePlaylistTitle);
  if (existsSync(playlistFolder)) {
    if (!config.get('skipExisting')) {
      sendError(new Error(`The folder ${playlistFolder} already exists`));
      return;
    }
  } else {
    mkdirSync(playlistFolder, { recursive: true });
  }

  dialog.showMessageBox({
    type: 'info',
    buttons: ['OK'],
    title: 'Started Download',
    message: `Downloading Playlist "${playlist.title}"`,
    detail: `(${playlist.items.length} songs)`,
  });

  if (is.dev()) {
    console.log(
      `Downloading playlist "${playlist.title}" - ${playlist.items.length} songs (${playlistId})`,
    );
  }

  win.setProgressBar(2); // Starts with indefinite bar

  setBadge(playlist.items.length);

  let counter = 1;

  const progressStep = 1 / playlist.items.length;

  const increaseProgress = (itemPercentage: number) => {
    const currentProgress = (counter - 1) / (playlist.items.length ?? 1);
    const newProgress = currentProgress + (progressStep * itemPercentage);
    win.setProgressBar(newProgress);
  };

  try {
    for (const song of playlist.items) {
      sendFeedback(`Downloading ${counter}/${playlist.items.length}...`);
      const trackId = isAlbum ? counter : undefined;
      await downloadSong(
        song.url,
        playlistFolder,
        trackId?.toString(),
        increaseProgress,
      ).catch((error) =>
        sendError(
          new Error(`Error downloading "${song.author.name} - ${song.title}":\n  ${error}`)
        ),
      );

      win.setProgressBar(counter / playlist.items.length);
      setBadge(playlist.items.length - counter);
      counter++;
    }
  } catch (error: unknown) {
    console.log('also?', error);
    sendError(error as Error);
  } finally {
    win.setProgressBar(-1); // Close progress bar
    setBadge(0); // Close badge counter
    sendFeedback(); // Clear feedback
  }
}

async function ffmpegWriteTags(filePath: string, metadata: CustomSongInfo, presetFFmpegArgs: string[] = [], ffmpegArgs: string[] = []) {
  const releaseFFmpegMutex = await ffmpegMutex.acquire();

  try {
    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }

    await ffmpeg.run(
      '-i',
      filePath,
      ...getFFmpegMetadataArgs(metadata),
      ...presetFFmpegArgs,
      ...ffmpegArgs,
      filePath,
    );
  } catch (error: unknown) {
    console.log('ffmpeg?', error);
    sendError(error as Error);
  } finally {
    releaseFFmpegMutex();
  }
}

function getFFmpegMetadataArgs(metadata: CustomSongInfo) {
  if (!metadata) {
    return [];
  }

  return [
    ...(metadata.title ? ['-metadata', `title=${metadata.title}`] : []),
    ...(metadata.artist ? ['-metadata', `artist=${metadata.artist}`] : []),
    ...(metadata.album ? ['-metadata', `album=${metadata.album}`] : []),
    ...(metadata.trackId ? ['-metadata', `track=${metadata.trackId}`] : []),
  ];
}

// Playlist radio modifier needs to be cut from playlist ID
const INVALID_PLAYLIST_MODIFIER = 'RDAMPL';

const getPlaylistID = (aURL: URL) => {
  const result
    = aURL?.searchParams.get('list') || aURL?.searchParams.get('playlist');
  if (result?.startsWith(INVALID_PLAYLIST_MODIFIER)) {
    return result.slice(INVALID_PLAYLIST_MODIFIER.length);
  }

  return result;
};

const getVideoId = (url: URL | string): string | null => {
  if (typeof url === 'string') {
    url = new URL(url);
  }

  return url.searchParams.get('v');
};

const getMetadata = (info: TrackInfo): CustomSongInfo => ({
  videoId: info.basic_info.id!,
  title: cleanupName(info.basic_info.title!),
  artist: cleanupName(info.basic_info.author!),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
  album: (info.player_overlays?.browser_media_session as any)?.album?.text as string | undefined,
  imageSrc: info.basic_info.thumbnail?.find((t) => !t.url.endsWith('.webp'))?.url,
  views: info.basic_info.view_count!,
  songDuration: info.basic_info.duration!,
});

// This is used to bypass age restrictions
const getAndroidTvInfo = async (id: string): Promise<VideoInfo> => {
  const innertube = await Innertube.create({
    client_type: ClientType.TV_EMBEDDED,
    generate_session_locally: true,
    retrieve_player: true,
  });
  // GetInfo 404s with the bypass, so we use getBasicInfo instead
  // that's fine as we only need the streaming data
  return await innertube.getBasicInfo(id, 'TV_EMBEDDED');
};
