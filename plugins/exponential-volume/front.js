// "Youtube Music fix volume ratio 0.4" by Marco Pfeiffer
// https://greasyfork.org/en/scripts/397686-youtube-music-fix-volume-ratio/

const exponentialVolume = () => {
	// manipulation exponent, higher value = lower volume
	// 3 is the value used by pulseaudio, which Barteks2x figured out this gist here: https://gist.github.com/Barteks2x/a4e189a36a10c159bb1644ffca21c02a
	// 0.05 (or 5%) is the lowest you can select in the UI which with an exponent of 3 becomes 0.000125 or 0.0125%
	const EXPONENT = 3;

	const storedOriginalVolumes = new WeakMap();
	const { get, set } = Object.getOwnPropertyDescriptor(
		HTMLMediaElement.prototype,
		"volume"
	);
	Object.defineProperty(HTMLMediaElement.prototype, "volume", {
		get() {
			const lowVolume = get.call(this);
			const calculatedOriginalVolume = lowVolume ** (1 / EXPONENT);

			// The calculated value has some accuracy issues which can lead to problems for implementations that expect exact values.
			// To avoid this, I'll store the unmodified volume to return it when read here.
			// This mostly solves the issue, but the initial read has no stored value and the volume can also change though external influences.
			// To avoid ill effects, I check if the stored volume is somewhere in the same range as the calculated volume.
			const storedOriginalVolume = storedOriginalVolumes.get(this);
			const storedDeviation = Math.abs(
				storedOriginalVolume - calculatedOriginalVolume
			);

			const originalVolume =
				storedDeviation < 0.01
					? storedOriginalVolume
					: calculatedOriginalVolume;
			return originalVolume;
		},
		set(originalVolume) {
			const lowVolume = originalVolume ** EXPONENT;
			storedOriginalVolumes.set(this, originalVolume);
			set.call(this, lowVolume);
		},
	});
};

module.exports = () =>
	document.addEventListener("apiLoaded", exponentialVolume, {
		once: true,
		passive: true,
	});
