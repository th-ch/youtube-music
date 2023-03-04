const { existsSync, mkdirSync, createWriteStream, writeFileSync } = require('fs');
const { join } = require("path");

const { fetchFromGenius } = require("../lyrics-genius/back");
const { isEnabled } = require("../../config/plugins");
const { getImage } = require("../../providers/song-info");
const { injectCSS } = require("../utils");
const { presets, cropMaxWidth, getFolder, setBadge, sendFeedback: sendFeedback_ } = require('./utils');

const { ipcMain, app, dialog } = require("electron");
const is = require("electron-is");
const { Innertube, UniversalCache, Utils } = require('youtubei.js');
const ytpl = require("ytpl"); // REPLACE with youtubei getplaylist https://github.com/LuanRT/YouTube.js#getplaylistid

const filenamify = require("filenamify");
const ID3Writer = require("browser-id3-writer");
const { randomBytes } = require("crypto");
const Mutex = require("async-mutex").Mutex;
const ffmpeg = require("@ffmpeg/ffmpeg").createFFmpeg({
    log: false,
    logger: () => { }, // console.log,
    progress: () => { }, // console.log,
});
const ffmpegMutex = new Mutex();

/** @type {Innertube} */
let yt;
let options;
let win;
let playingUrl = undefined;

const sendError = (error) => {
	win.setProgressBar(-1); // close progress bar
	setBadge(0); // close badge
	sendFeedback_(win); // reset feedback


	console.error(error);
	dialog.showMessageBox({
		type: "info",
		buttons: ["OK"],
		title: "Error in download!",
		message: "Argh! Apologies, download failed…",
		detail: error.toString(),
	});
};

module.exports = async (win_, options_) => {
    options = options_;
    win = win_;
    injectCSS(win.webContents, join(__dirname, "style.css"));

    yt = await Innertube.create({ cache: new UniversalCache(false), generate_session_locally: true });
    ipcMain.handle("download-song", (_, url) => downloadSong(url));
    ipcMain.on("video-src-changed", async (_, data) => {
        playingUrl = JSON.parse(data)?.microformat?.microformatDataRenderer?.urlCanonical;
    });
    ipcMain.on("download-playlist-request", async (_event, url) => downloadPlaylist(url, win, options));
};

async function downloadSong(url, playlistFolder = undefined, trackId = undefined, increasePlaylistProgress = ()=>{}) {
    const sendFeedback = (message, progress) => {
        if (!playlistFolder) {
            sendFeedback_(win, message);
            if (!isNaN(progress)) {
                win.setProgressBar(progress);
            }
        }
    };

    sendFeedback(`Downloading...`, 2);
    const metadata = await getMetadata(url);
    metadata.trackId = trackId;

    const download_options = {
        type: 'audio', // audio, video or video+audio
        quality: 'best', // best, bestefficiency, 144p, 240p, 480p, 720p and so on.
        format: 'any' // media container format 
    };

    const format = metadata.info.chooseFormat(download_options);
    const stream = await metadata.info.download(download_options);

    console.info(`Downloading ${metadata.artist} - ${metadata.title} [${metadata.id}]`);

    const iterableStream = Utils.streamToIterable(stream);

    const dir = playlistFolder || options.downloadFolder || app.getPath("downloads");
    const name = `${metadata.artist ? `${metadata.artist} - ` : ""}${metadata.title}`;

    const extension = presets[options.preset]?.extension || 'mp3';

    const filename = filenamify(`${name}.${extension}`, {
        replacement: "_",
        maxLength: 255,
    });
    const filePath = join(dir, filename);

    if (!existsSync(dir)) {
        mkdirSync(dir);
    }

    if (!presets[options.preset]) {
        const fileBuffer = await toMP3(iterableStream, metadata, format.content_length, sendFeedback, increasePlaylistProgress);
        writeFileSync(filePath, await writeID3(fileBuffer, metadata, sendFeedback));
    } else {
        const file = createWriteStream(filePath);
        let downloaded = 0;
        let total = format.content_length;

        for await (const chunk of iterableStream) {
            downloaded += chunk.length;
            const ratio = downloaded / total;
            const progress = Math.floor(ratio * 100);
            sendFeedback("Download: " + progress + "%", ratio);
            increasePlaylistProgress(ratio);
            file.write(chunk);
        }
        await ffmpegWriteTags(filePath, metadata, presets[options.preset]?.ffmpegArgs);
        sendFeedback(null, -1);
    }

    sendFeedback(null, -1);
    console.info(`Saved download to ${filePath}`);
}
module.exports.downloadSong = downloadSong;

async function getMetadata(url) {
    const id = url.match(/v=([^&]+)/)?.[1];
    const info = await yt.music.getInfo(id);

    return {
        id: info.basic_info.id,
        title: info.basic_info.title,
        artist: info.basic_info.author,
        album: info.player_overlays?.browser_media_session?.album?.text,
        image: info.basic_info.thumbnail[0].url,
        info
    };
}

async function writeID3(buffer, metadata, sendFeedback) {
    try {
        sendFeedback("Writing ID3 tags...");

        const nativeImage = cropMaxWidth(await getImage(metadata.image));
        const coverBuffer = nativeImage && !nativeImage.isEmpty() ?
            nativeImage.toPNG() : null;

        const writer = new ID3Writer(buffer);

        // Create the metadata tags
        writer
            .setFrame("TIT2", metadata.title)
            .setFrame("TPE1", [metadata.artist]);
        if (metadata.album) {
            writer.setFrame("TALB", metadata.album);
        }
        if (coverBuffer) {
            writer.setFrame("APIC", {
                type: 3,
                data: coverBuffer,
                description: "",
            });
        }
        if (isEnabled("lyrics-genius")) {
            const lyrics = await fetchFromGenius(metadata);
            if (lyrics) {
                writer.setFrame("USLT", {
                    description: '',
                    lyrics: lyrics,
                });
            }
        }
        if (metadata.trackId) {
            writer.setFrame("TRCK", metadata.trackId);
        }
        writer.addTag();
        return Buffer.from(writer.arrayBuffer);
    } catch (e) {
        sendError(e);
    }
}

async function toMP3(stream, metadata, content_length, sendFeedback, increasePlaylistProgress = () => { }, extension = "mp3") {
    const chunks = [];
    let downloaded = 0;
    let total = content_length;
    for await (const chunk of stream) {
        downloaded += chunk.length;
        chunks.push(chunk);
        const ratio = downloaded / total;
        const progress = Math.floor(ratio * 100);
        sendFeedback("Download: " + progress + "%", ratio);
        increasePlaylistProgress(ratio);
    }
    sendFeedback("Loading…", 2); // indefinite progress bar after download

    const buffer = Buffer.concat(chunks);
    const safeVideoName = randomBytes(32).toString("hex");
    const releaseFFmpegMutex = await ffmpegMutex.acquire();

    try {
        if (!ffmpeg.isLoaded()) {
            await ffmpeg.load();
        }

        sendFeedback("Preparing file…");
        ffmpeg.FS("writeFile", safeVideoName, buffer);

        sendFeedback("Converting…");

        await ffmpeg.run(
            "-i",
            safeVideoName,
            ...getFFmpegMetadataArgs(metadata),
            safeVideoName + "." + extension
        );

        sendFeedback("Saving…");

        return ffmpeg.FS("readFile", safeVideoName + "." + extension);
    } catch (e) {
        sendError(e);
    } finally {
        releaseFFmpegMutex();
    }
}

async function ffmpegWriteTags(filePath, metadata, ffmpegArgs = []) {
    const releaseFFmpegMutex = await ffmpegMutex.acquire();

    try {
        if (!ffmpeg.isLoaded()) {
            await ffmpeg.load();
        }

        await ffmpeg.run(
            "-i",
            filePath,
            ...getFFmpegMetadataArgs(metadata),
            ...ffmpegArgs,
            filePath
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
        ...(metadata.title ? ["-metadata", `title=${metadata.title}`] : []),
        ...(metadata.artist ? ["-metadata", `artist=${metadata.artist}`] : []),
        ...(metadata.album ? ["-metadata", `album=${metadata.album}`] : []),
        ...(metadata.trackId ? ["-metadata", `track=${metadata.trackId}`] : []),
    ];
};

// Playlist radio modifier needs to be cut from playlist ID
const INVALID_PLAYLIST_MODIFIER = 'RDAMPL';

const getPlaylistID = aURL => {
    const result = aURL?.searchParams.get("list") || aURL?.searchParams.get("playlist");
    if (result?.startsWith(INVALID_PLAYLIST_MODIFIER)) {
        return result.slice(6)
    }
    return result;
};

async function downloadPlaylist(givenUrl) {
    if (givenUrl) {
        try {
            givenUrl = new URL(givenUrl);
        } catch {
            givenUrl = undefined;
        };
    }
    const playlistId = getPlaylistID(givenUrl)
        || getPlaylistID(new URL(win.webContents.getURL()))
        || getPlaylistID(new URL(playingUrl));

    if (!playlistId) {
        sendError(new Error("No playlist ID found"));
        return;
    }

    const sendFeedback = message => sendFeedback_(win, message);

    console.log(`trying to get playlist ID: '${playlistId}'`);
    sendFeedback("Getting playlist info…");
    let playlist;
    try {
        playlist = await ytpl(playlistId, {
            limit: options.playlistMaxItems || Infinity,
        });
    } catch (e) {
        sendError(e);
        return;
    }
    let isAlbum = playlist.title.startsWith('Album - ');
    if (isAlbum) {
        playlist.title = playlist.title.slice(8);
    }
    const safePlaylistTitle = filenamify(playlist.title, { replacement: ' ' });

    const folder = getFolder(options.downloadFolder);
    const playlistFolder = join(folder, safePlaylistTitle);
    if (existsSync(playlistFolder)) {
        sendError(new Error(`The folder ${playlistFolder} already exists`));
        return;
    }
    mkdirSync(playlistFolder, { recursive: true });

    dialog.showMessageBox({
        type: "info",
        buttons: ["OK"],
        title: "Started Download",
        message: `Downloading Playlist "${playlist.title}"`,
        detail: `(${playlist.items.length} songs)`,
    });

    if (is.dev()) {
        console.log(
            `Downloading playlist "${playlist.title}" - ${playlist.items.length} songs (${playlistId})`
        );
    }

    win.setProgressBar(2); // starts with indefinite bar

    setBadge(playlist.items.length);

    let counter = 1;

    const progressStep = 1 / playlist.items.length;

    const increaseProgress = (itemPercentage) => {
        const currentProgress = (counter - 1) / playlist.items.length;
        const newProgress = currentProgress + (progressStep * itemPercentage);
        win.setProgressBar(newProgress);
    };

    try {
        for (const song of playlist.items) {
            sendFeedback(`Downloading ${counter}/${playlist.items.length}...`);
            const trackId = isAlbum ? counter : undefined;
            await downloadSong(song.url, playlistFolder, trackId, increaseProgress).catch((e) => sendError(e));
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
