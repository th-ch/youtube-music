module.exports = (options) => {
	let isSilent = false;
	let hasAudioStarted = false;

	const smoothing = 0.1;
	const threshold = -100; // dB (-100 = absolute silence, 0 = loudest)
	const interval = 2; // ms
	const history = 10;
	const speakingHistory = Array(history).fill(0);

	document.addEventListener(
		"audioCanPlay",
		(e) => {
			const video = document.querySelector("video");
			const audioContext = e.detail.audioContext;
			const sourceNode = e.detail.audioSource;

			// Use an audio analyser similar to Hark
			// https://github.com/otalk/hark/blob/master/hark.bundle.js
			const analyser = audioContext.createAnalyser();
			analyser.fftSize = 512;
			analyser.smoothingTimeConstant = smoothing;
			const fftBins = new Float32Array(analyser.frequencyBinCount);

			sourceNode.connect(analyser);
			analyser.connect(audioContext.destination);

			const looper = () => {
				setTimeout(() => {
					const currentVolume = getMaxVolume(analyser, fftBins);

					let history = 0;
					if (currentVolume > threshold && isSilent) {
						// trigger quickly, short history
						for (
							let i = speakingHistory.length - 3;
							i < speakingHistory.length;
							i++
						) {
							history += speakingHistory[i];
						}
						if (history >= 2) {
							// Not silent
							isSilent = false;
							hasAudioStarted = true;
						}
					} else if (currentVolume < threshold && !isSilent) {
						for (let i = 0; i < speakingHistory.length; i++) {
							history += speakingHistory[i];
						}
						if (history == 0) {
							// Silent
							if (
								!(
									video.paused ||
									video.seeking ||
									video.ended ||
									video.muted ||
									video.volume === 0
								)
							) {
								isSilent = true;
								skipSilence();
							}
						}
					}
					speakingHistory.shift();
					speakingHistory.push(0 + (currentVolume > threshold));

					looper();
				}, interval);
			};
			looper();

			const skipSilence = () => {
				if (options.onlySkipBeginning && hasAudioStarted) {
					return;
				}

				if (isSilent && !video.paused) {
					video.currentTime += 0.2; // in s
				}
			};

			video.addEventListener("play", function () {
				hasAudioStarted = false;
				skipSilence();
			});

			video.addEventListener("seeked", function () {
				hasAudioStarted = false;
				skipSilence();
			});
		},
		{
			passive: true,
		}
	);
};

function getMaxVolume(analyser, fftBins) {
	var maxVolume = -Infinity;
	analyser.getFloatFrequencyData(fftBins);

	for (var i = 4, ii = fftBins.length; i < ii; i++) {
		if (fftBins[i] > maxVolume && fftBins[i] < 0) {
			maxVolume = fftBins[i];
		}
	}

	return maxVolume;
}
