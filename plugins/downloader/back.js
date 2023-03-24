const {
  existsSync,
  mkdirSync,
  createWriteStream,
  writeFileSync,
} = require('fs');
const { join } = require('path');

const { fetchFromGenius } = require('../lyrics-genius/back');
const { isEnabled } = require('../../config/plugins');
const { getImage } = require('../../providers/song-info');
const { injectCSS } = require('../utils');
const {
  presets,
  cropMaxWidth,
  getFolder,
  setBadge,
  sendFeedback: sendFeedback_,
} = require('./utils');

const { ipcMain, app, dialog } = require('electron');
const is = require('electron-is');
const { Innertube, UniversalCache, Utils, ClientType } = require('youtubei.js');
const ytpl = require('ytpl'); // REPLACE with youtubei getplaylist https://github.com/LuanRT/YouTube.js#getplaylistid

const filenamify = require('filenamify');
const ID3Writer = require('browser-id3-writer');
const { randomBytes } = require('crypto');
const Mutex = require('async-mutex').Mutex;
const ffmpeg = require('@ffmpeg/ffmpeg').createFFmpeg({
  log: false,
  logger: () => {}, // console.log,
  progress: () => {}, // console.log,
});
const ffmpegMutex = new Mutex();

const cache = {
  getCoverBuffer: {
    buffer: null,
    url: null,
  },
};

const config = require('./config');

/** @type {Innertube} */
let yt;
let win;
let playingUrl = undefined;

const sendError = (error, source) => {
  win.setProgressBar(-1); // close progress bar
  setBadge(0); // close badge
  sendFeedback_(win); // reset feedback

  const songNameMessage = source ? `\nin ${source}` : '';
  const cause = error.cause ? `\n\n${error.cause.toString()}` : '';
  const message = `${error.toString()}${songNameMessage}${cause}`;

  console.error(message);
  dialog.showMessageBox({
    type: 'info',
    buttons: ['OK'],
    title: 'Error in download!',
    message: 'Argh! Apologies, download failed…',
    detail: message,
  });
};

module.exports = async (win_) => {
  win = win_;
  injectCSS(win.webContents, join(__dirname, 'style.css'));

  yt = await Innertube.create({
    cache: new UniversalCache(false),
    generate_session_locally: true,
  });
  ipcMain.on('download-song', (_, url) => downloadSong(url));
  ipcMain.on('video-src-changed', async (_, data) => {
    playingUrl =
      JSON.parse(data)?.microformat?.microformatDataRenderer?.urlCanonical;
  });
  ipcMain.on('download-playlist-request', async (_event, url) =>
    downloadPlaylist(url),
  );
};

module.exports.downloadSong = downloadSong;
module.exports.downloadPlaylist = downloadPlaylist;

async function downloadSong(
  url,
  playlistFolder = undefined,
  trackId = undefined,
  increasePlaylistProgress = () => {},
) {
  let resolvedName = undefined;
  try {
    await downloadSongUnsafe(
      url,
      name=>resolvedName=name,
      playlistFolder,
      trackId,
      increasePlaylistProgress,
    );
  } catch (error) {
    sendError(error, resolvedName || url);
  }
}

async function downloadSongUnsafe(
  url,
  setName,
  playlistFolder = undefined,
  trackId = undefined,
  increasePlaylistProgress = () => {},
) {
  const sendFeedback = (message, progress) => {
    if (!playlistFolder) {
      sendFeedback_(win, message);
      if (!isNaN(progress)) {
        win.setProgressBar(progress);
      }
    }
  };

  sendFeedback('Downloading...', 2);

  const id = getVideoId(url);
  let info = await yt.music.getInfo(id);

  if (!info) {
    throw new Error('Video not found');
  }

  const metadata = getMetadata(info);
  if (metadata.album === 'N/A') metadata.album = '';
  metadata.trackId = trackId;

  const dir =
    playlistFolder || config.get('downloadFolder') || app.getPath('downloads');
  const name = `${metadata.artist ? `${metadata.artist} - ` : ''}${
    metadata.title
  }`;
  setName(name);

	let playabilityStatus = info.playability_status;
	let bypassedResult = null;
	if (playabilityStatus.status === "LOGIN_REQUIRED") {
		// try to bypass the age restriction
		bypassedResult = await getAndroidTvInfo(id);
		playabilityStatus = bypassedResult.playability_status;

		if (playabilityStatus.status === "LOGIN_REQUIRED") {
			throw new Error(
				`[${playabilityStatus.status}] ${playabilityStatus.reason}`,
			);
		}

		info = bypassedResult;
	}

	if (playabilityStatus.status === "UNPLAYABLE") {
		/**
		 * @typedef {import('youtubei.js/dist/src/parser/classes/PlayerErrorMessage').default} PlayerErrorMessage
		 * @type {PlayerErrorMessage}
		 */
		const errorScreen = playabilityStatus.error_screen;
		throw new Error(
			`[${playabilityStatus.status}] ${errorScreen.reason.text}: ${errorScreen.subreason.text}`,
		);
	}

  const extension = presets[config.get('preset')]?.extension || 'mp3';

  const filename = filenamify(`${name}.${extension}`, {
    replacement: '_',
    maxLength: 255,
  });
  const filePath = join(dir, filename);

  if (config.get('skipExisting') && existsSync(filePath)) {
    sendFeedback(null, -1);
    return;
  }

  const download_options = {
    type: 'audio', // audio, video or video+audio
    quality: 'best', // best, bestefficiency, 144p, 240p, 480p, 720p and so on.
    format: 'any', // media container format
  };

  const format = info.chooseFormat(download_options);
  const stream = await info.download(download_options);

  console.info(
    `Downloading ${metadata.artist} - ${metadata.title} [${metadata.id}]`,
  );

  const iterableStream = Utils.streamToIterable(stream);

  if (!existsSync(dir)) {
    mkdirSync(dir);
  }

  if (!presets[config.get('preset')]) {
    const fileBuffer = await iterableStreamToMP3(
      iterableStream,
      metadata,
      format.content_length,
      sendFeedback,
      increasePlaylistProgress,
    );
    writeFileSync(filePath, await writeID3(fileBuffer, metadata, sendFeedback));
  } else {
    const file = createWriteStream(filePath);
    let downloaded = 0;
    const total = format.content_length;

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
      presets[config.get('preset')]?.ffmpegArgs,
    );
    sendFeedback(null, -1);
  }

  sendFeedback(null, -1);
  console.info(`Done: "${filePath}"`);
}

async function iterableStreamToMP3(
  stream,
  metadata,
  content_length,
  sendFeedback,
  increasePlaylistProgress = () => {},
) {
  const chunks = [];
  let downloaded = 0;
  const total = content_length;
  for await (const chunk of stream) {
    downloaded += chunk.length;
    chunks.push(chunk);
    const ratio = downloaded / total;
    const progress = Math.floor(ratio * 100);
    sendFeedback(`Download: ${progress}%`, ratio);
    // 15% for download, 85% for conversion
    // This is a very rough estimate, trying to make the progress bar look nice
    increasePlaylistProgress(ratio * 0.15);
  }
  sendFeedback('Loading…', 2); // indefinite progress bar after download

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
      increasePlaylistProgress(0.15 + ratio * 0.85);
    });

    await ffmpeg.run(
      '-i',
      safeVideoName,
      ...getFFmpegMetadataArgs(metadata),
      `${safeVideoName}.mp3`,
    );

    sendFeedback('Saving…');

    return ffmpeg.FS('readFile', `${safeVideoName}.mp3`);
  } catch (e) {
    sendError(e, safeVideoName);
  } finally {
    releaseFFmpegMutex();
  }
}

async function getCoverBuffer(url) {
  const store = cache.getCoverBuffer;
  if (store.url === url) {
    return store.buffer;
  }
  store.url = url;

  const nativeImage = cropMaxWidth(await getImage(url));
  store.buffer =
    nativeImage && !nativeImage.isEmpty() ? nativeImage.toPNG() : null;

  return store.buffer;
}

async function writeID3(buffer, metadata, sendFeedback) {
  try {
    sendFeedback('Writing ID3 tags...');

    const coverBuffer = await getCoverBuffer(metadata.image);

    const writer = new ID3Writer(buffer);

    // Create the metadata tags
    writer.setFrame('TIT2', metadata.title).setFrame('TPE1', [metadata.artist]);
    if (metadata.album) {
      writer.setFrame('TALB', metadata.album);
    }
    if (coverBuffer) {
      writer.setFrame('APIC', {
        type: 3,
        data: coverBuffer,
        description: '',
      });
    }
    if (isEnabled('lyrics-genius')) {
      const lyrics = await fetchFromGenius(metadata);
      if (lyrics) {
        writer.setFrame('USLT', {
          description: '',
          lyrics: lyrics,
        });
      }
    }
    if (metadata.trackId) {
      writer.setFrame('TRCK', metadata.trackId);
    }
    writer.addTag();
    return Buffer.from(writer.arrayBuffer);
  } catch (e) {
    sendError(e, `${metadata.artist} - ${metadata.title}`);
  }
}

async function downloadPlaylist(givenUrl) {
  try {
    givenUrl = new URL(givenUrl);
  } catch {
    givenUrl = undefined;
  }
  const playlistId =
    getPlaylistID(givenUrl) ||
    getPlaylistID(new URL(win.webContents.getURL())) ||
    getPlaylistID(new URL(playingUrl));

  if (!playlistId) {
    sendError(new Error('No playlist ID found'));
    return;
  }

  const sendFeedback = (message) => sendFeedback_(win, message);

  console.log(`trying to get playlist ID: '${playlistId}'`);
  sendFeedback('Getting playlist info…');
  let playlist;
  try {
    playlist = await ytpl(playlistId, {
      limit: config.get('playlistMaxItems') || Infinity,
    });
  } catch (e) {
    sendError(
      `Error getting playlist info: make sure it isn\'t a private or "Mixed for you" playlist\n\n${e}`,
    );
    return;
  }
  if (playlist.items.length === 0) sendError(new Error('Playlist is empty'));
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

  const folder = getFolder(config.get('downloadFolder'));
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

  win.setProgressBar(2); // starts with indefinite bar

  setBadge(playlist.items.length);

  let counter = 1;

  const progressStep = 1 / playlist.items.length;

  const increaseProgress = (itemPercentage) => {
    const currentProgress = (counter - 1) / playlist.items.length;
    const newProgress = currentProgress + progressStep * itemPercentage;
    win.setProgressBar(newProgress);
  };

  try {
    for (const song of playlist.items) {
      sendFeedback(`Downloading ${counter}/${playlist.items.length}...`);
      const trackId = isAlbum ? counter : undefined;
      await downloadSong(
        song.url,
        playlistFolder,
        trackId,
        increaseProgress,
      ).catch((e) =>
        sendError(
          `Error downloading "${song.author.name} - ${song.title}":\n  ${e}`,
        ),
      );

      win.setProgressBar(counter / playlist.items.length);
      setBadge(playlist.items.length - counter);
      counter++;
    }
  } catch (e) {
    sendError(e);
  } finally {
    win.setProgressBar(-1); // close progress bar
    setBadge(0); // close badge counter
    sendFeedback(); // clear feedback
  }
}

async function ffmpegWriteTags(filePath, metadata, ffmpegArgs = []) {
  const releaseFFmpegMutex = await ffmpegMutex.acquire();

  try {
    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
    }

    await ffmpeg.run(
      '-i',
      filePath,
      ...getFFmpegMetadataArgs(metadata),
      ...ffmpegArgs,
      filePath,
    );
  } catch (e) {
    sendError(e);
  } finally {
    releaseFFmpegMutex();
  }
}

function getFFmpegMetadataArgs(metadata) {
  if (!metadata) {
    return;
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

const getPlaylistID = (aURL) => {
  const result =
    aURL?.searchParams.get('list') || aURL?.searchParams.get('playlist');
  if (result?.startsWith(INVALID_PLAYLIST_MODIFIER)) {
    return result.slice(INVALID_PLAYLIST_MODIFIER.length);
  }
  return result;
};

const getVideoId = (url) => {
  if (typeof url === 'string') {
    url = new URL(url);
  }
  return url.searchParams.get('v');
};

const getMetadata = (info) => ({
  id: info.basic_info.id,
  title: info.basic_info.title,
  artist: info.basic_info.author,
  album: info.player_overlays?.browser_media_session?.album?.text,
  image: info.basic_info.thumbnail[0].url,
});

// This is used to bypass age restrictions
const getAndroidTvInfo = async (id) => {
  const innertube = await Innertube.create({
    clientType: ClientType.TV_EMBEDDED,
    generate_session_locally: true,
    retrieve_player: true,
  });
  const info = await innertube.getBasicInfo(id, 'TV_EMBEDDED');
  // getInfo 404s with the bypass, so we use getBasicInfo instead
  // that's fine as we only need the streaming data
  return info;
}
