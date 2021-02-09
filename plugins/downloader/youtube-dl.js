const { randomBytes } = require("crypto");
const { writeFileSync } = require("fs");
const { join } = require("path");
const { ipcRenderer } = require("electron");

const downloadsFolder = require("downloads-folder");
const is = require("electron-is");
const filenamify = require("filenamify");

// Browser version of FFmpeg (in renderer process) instead of loading @ffmpeg/ffmpeg
// because --js-flags cannot be passed in the main process when the app is packaged
// See https://github.com/electron/electron/issues/22705
const FFmpeg = require("@ffmpeg/ffmpeg/dist/ffmpeg.min");
const ytdl = require("ytdl-core");

const { createFFmpeg } = FFmpeg;
const ffmpeg = createFFmpeg({
	log: false,
	logger: () => {}, // console.log,
	progress: () => {}, // console.log,
});

const downloadVideoToMP3 = (
	videoUrl,
	sendFeedback,
	sendError,
	reinit,
	options
) => {
	sendFeedback("Downloading…");

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
		.on("progress", (chunkLength, downloaded, total) => {
			const progress = Math.floor((downloaded / total) * 100);
			sendFeedback("Download: " + progress + "%");
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
		.on("end", () => {
			const buffer = Buffer.concat(chunks);
			toMP3(videoName, buffer, sendFeedback, sendError, reinit, options);
		});
};

const toMP3 = async (
	videoName,
	buffer,
	sendFeedback,
	sendError,
	reinit,
	options
) => {
	const safeVideoName = randomBytes(32).toString("hex");
	const extension = options.extension || "mp3";

	try {
		if (!ffmpeg.isLoaded()) {
			sendFeedback("Loading…");
			await ffmpeg.load();
		}

		sendFeedback("Preparing file…");
		ffmpeg.FS("writeFile", safeVideoName, buffer);

		sendFeedback("Converting…");
		await ffmpeg.run(
			"-i",
			safeVideoName,
			...(options.ffmpegArgs || []),
			safeVideoName + "." + extension
		);

		const folder = options.downloadFolder || downloadsFolder();
		const filename = filenamify(videoName + "." + extension, {
			replacement: "_",
		});
		writeFileSync(
			join(folder, filename),
			ffmpeg.FS("readFile", safeVideoName + "." + extension)
		);
		// Add the metadata
		sendFeedback("Adding metadata…");
		ipcRenderer.send('add-metadata', join(folder, filename))
		ipcRenderer.once('add-metadata-done', reinit)
	} catch (e) {
		sendError(e);
	}
};

module.exports = {
	downloadVideoToMP3,
};
