const { existsSync, mkdirSync, createWriteStream, writeFileSync } = require('fs');
const { ipcMain, app } = require("electron");
const { join } = require("path");

const { Innertube, UniversalCache, Utils } = require('youtubei.js');
const filenamify = require("filenamify");
const id3 = require('node-id3').Promise;

const { sendError } = require("./back");
const { presets } = require('./utils');

ffmpegWriteTags
/** @type {Innertube} */
let yt;
let options;

module.exports = async (options_) => {
    options = options_;
    yt = await Innertube.create({ cache: new UniversalCache(false), generate_session_locally: true });
    ipcMain.handle("download-song", (_, url) => downloadSong(url));
};

async function downloadSong(url, playlistFolder = undefined) {
    const metadata = await getMetadata(url);

    const stream = await yt.download(metadata.id, {
        type: 'audio', // audio, video or video+audio
        quality: 'best', // best, bestefficiency, 144p, 240p, 480p, 720p and so on.
        format: 'any' // media container format 
    });

    console.info(`Downloading ${metadata.artist} - ${metadata.title} {${metadata.id}}...`);

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
        await toMP3(iterableStream, filePath, metadata);
        console.info('writing id3 tags...'); // DELETE
        await writeID3(filePath, metadata).then(() => console.info('done writing id3 tags!')); // DELETE
    } else {
        const file = createWriteStream(filePath);
        //stream.pipeTo(file);
        for await (const chunk of iterableStream) {
            file.write(chunk);
        }
        ffmpegWriteTags(filePath, metadata, presets[options.preset]?.ffmpegArgs);
    }

    console.info(`${filePath} - Done!`, '\n');
}
module.exports.downloadSong = downloadSong;

function getIdFromUrl(url) {
    const match = url.match(/v=([^&]+)/);
    return match ? match[1] : null;
}

async function getMetadata(url) {
    const id = getIdFromUrl(url);
    const info = await yt.music.getInfo(id);
    //console.log('got info:' + JSON.stringify(info, null, 2)); // DELETE

    return {
        id: info.basic_info.id,
        title: info.basic_info.title,
        artist: info.basic_info.author,
        album: info.player_overlays?.browser_media_session?.album?.text,
        image: info.basic_info.thumbnail[0].url,
    };
}

const { getImage } = require("../../providers/song-info");
const { cropMaxWidth } = require("./utils");

async function writeID3(filePath, metadata) {
    const tags = {
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        image: {
            mime: "image/png",
            type: {
                id: 3,
                name: "front cover"
            },
            description: "",
            imageBuffer: cropMaxWidth(await getImage(metadata.image))?.toPNG(),
        }
        // TODO: lyrics
    };

    await id3.write(tags, filePath);
}

const { randomBytes } = require("crypto");
const Mutex = require("async-mutex").Mutex;
const ffmpeg = require("@ffmpeg/ffmpeg").createFFmpeg({
    log: false,
    logger: () => { }, // console.log,
    progress: () => { }, // console.log,
});

const ffmpegMutex = new Mutex();

async function toMP3(stream, filePath, metadata, extension = "mp3") {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const safeVideoName = randomBytes(32).toString("hex");
    const releaseFFmpegMutex = await ffmpegMutex.acquire();

    try {
        if (!ffmpeg.isLoaded()) {
            // sendFeedback("Loading…", 2); // indefinite progress bar after download
            await ffmpeg.load();
        }

        // sendFeedback("Preparing file…");
        ffmpeg.FS("writeFile", safeVideoName, buffer);

        // sendFeedback("Converting…");

        await ffmpeg.run(
            "-i",
            safeVideoName,
            ...getFFmpegMetadataArgs(metadata),
            safeVideoName + "." + extension
        );

        const fileBuffer = ffmpeg.FS("readFile", safeVideoName + "." + extension);

        await writeID3(fileBuffer, metadata);

        // sendFeedback("Saving…");

        writeFileSync(filePath, fileBuffer);
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
    ];
};
