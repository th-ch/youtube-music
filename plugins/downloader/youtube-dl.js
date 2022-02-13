const { randomBytes } = require("crypto");
const { join } = require("path");

const Mutex = require("async-mutex").Mutex;
const { ipcRenderer } = require("electron");
const is = require("electron-is");
const filenamify = require("filenamify");

// Browser version of FFmpeg (in renderer process) instead of loading @ffmpeg/ffmpeg
// because --js-flags cannot be passed in the main process when the app is packaged
// See https://github.com/electron/electron/issues/22705
const FFmpeg = require("@ffmpeg/ffmpeg/dist/ffmpeg.min");
const ytdl = require("ytdl-core");

const { triggerAction, triggerActionSync } = require("../utils");
const { ACTIONS, CHANNEL } = require("./actions.js");
const { presets, urlToJPG } = require("./utils");
const { cleanupName } = require("../../providers/song-info");

const { createFFmpeg } = FFmpeg;
const ffmpeg = createFFmpeg({
	log: false,
	logger: () => {}, // console.log,
	progress: () => {}, // console.log,
});
const ffmpegMutex = new Mutex();

const downloadVideoToMP3 = async (
	videoUrl,
	sendFeedback,
	sendError,
	reinit,
	options,
	metadata = undefined,
	subfolder = ""
) => {
	sendFeedback("Downloading…");

	if (metadata === null) {
		const { videoDetails } = await ytdl.getInfo(videoUrl);
		const thumbnails = videoDetails?.thumbnails;
		metadata = {
			artist:
				videoDetails?.media?.artist ||
				cleanupName(videoDetails?.author?.name) ||
				"",
			title: videoDetails?.media?.song || videoDetails?.title || "",
			imageSrcYTPL: thumbnails ?
				urlToJPG(thumbnails[thumbnails.length - 1].url, videoDetails?.videoId)
				: ""
		}
	}

	let videoName = "YouTube Music - Unknown title";
	let videoReadableStream;
	try {
		videoReadableStream = ytdl(videoUrl, {
			filter: "audioonly",
			quality: "highestaudio",
			highWaterMark: 32 * 1024 * 1024, // 32 MB
			requestOptions: { maxRetries: 3 },
		});
	} catch (err) {
		sendError(err);
		return;
	}

	const chunks = [];
	videoReadableStream
		.on("data", (chunk) => {
			chunks.push(chunk);
		})
		.on("progress", (_chunkLength, downloaded, total) => {
			const ratio = downloaded / total;
			const progress = Math.floor(ratio * 100);
			sendFeedback("Download: " + progress + "%", ratio);
		})
		.on("info", (info, format) => {
			videoName = info.videoDetails.title.replace("|", "").toString("ascii");
			if (is.dev()) {
				console.log(
					"Downloading video - name:",
					videoName,
					"- quality:",
					format.audioBitrate + "kbits/s"
				);
			}
		})
		.on("error", sendError)
		.on("end", async () => {
			const buffer = Buffer.concat(chunks);
			await toMP3(
				videoName,
				buffer,
				sendFeedback,
				sendError,
				reinit,
				options,
				metadata,
				subfolder
			);
		});
};

const toMP3 = async (
	videoName,
	buffer,
	sendFeedback,
	sendError,
	reinit,
	options,
	existingMetadata = undefined,
	subfolder = ""
) => {
	const convertOptions = { ...presets[options.preset], ...options };
	const safeVideoName = randomBytes(32).toString("hex");
	const extension = convertOptions.extension || "mp3";
	const releaseFFmpegMutex = await ffmpegMutex.acquire();

	try {
		if (!ffmpeg.isLoaded()) {
			sendFeedback("Loading…", 2); // indefinite progress bar after download
			await ffmpeg.load();
		}

		sendFeedback("Preparing file…");
		ffmpeg.FS("writeFile", safeVideoName, buffer);

		sendFeedback("Converting…");
		const metadata = existingMetadata || getMetadata();
		await ffmpeg.run(
			"-i",
			safeVideoName,
			...getFFmpegMetadataArgs(metadata),
			...(convertOptions.ffmpegArgs || []),
			safeVideoName + "." + extension
		);

		const folder = options.downloadFolder || await ipcRenderer.invoke('getDownloadsFolder');
		const name = metadata.title
			? `${metadata.artist ? `${metadata.artist} - ` : ""}${metadata.title}`
			: videoName;
		const filename = filenamify(name + "." + extension, {
			replacement: "_",
			maxLength: 255,
		});

		const filePath = join(folder, subfolder, filename);
		const fileBuffer = ffmpeg.FS("readFile", safeVideoName + "." + extension);

		// Add the metadata
		sendFeedback("Adding metadata…");
		ipcRenderer.send("add-metadata", filePath, fileBuffer, {
			artist: metadata.artist,
			title: metadata.title,
			imageSrcYTPL: metadata.imageSrcYTPL
		});
		ipcRenderer.once("add-metadata-done", reinit);
	} catch (e) {
		sendError(e);
	} finally {
		releaseFFmpegMutex();
	}
};

const getMetadata = () => {
	return JSON.parse(triggerActionSync(CHANNEL, ACTIONS.METADATA));
};

const getFFmpegMetadataArgs = (metadata) => {
	if (!metadata) {
		return;
	}

	return [
		...(metadata.title ? ["-metadata", `title=${metadata.title}`] : []),
		...(metadata.artist ? ["-metadata", `artist=${metadata.artist}`] : []),
	];
};

module.exports = {
	downloadVideoToMP3,
};

ipcRenderer.on(
	"downloader-download-playlist",
	(_, url, playlistFolder, options) => {
		downloadVideoToMP3(
			url,
			() => {},
			(error) => {
				triggerAction(CHANNEL, ACTIONS.ERROR, error);
			},
			() => {},
			options,
			null,
			playlistFolder
		);
	}
);
