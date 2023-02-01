/**
 * VolumeFader
 * Sophisticated Media Volume Fading
 *
 * Requires browser support for:
 * - HTMLMediaElement
 * - requestAnimationFrame()
 * - ES6
 *
 * Does not depend on any third-party library.
 *
 * License: MIT
 *
 * Nick Schwarzenberg
 * v0.2.0, 07/2016
 */

(function (root) {
	"use strict";

	// internal utility: check if value is a valid volume level and throw if not
	let validateVolumeLevel = (value) => {
		// number between 0 and 1?
		if (!Number.isNaN(value) && value >= 0 && value <= 1) {
			// yup, that's fine
			return;
		} else {
			// abort and throw an exception
			throw new TypeError("Number between 0 and 1 expected as volume!");
		}
	};

	// main class
	class VolumeFader {
		/**
		 * VolumeFader Constructor
		 *
		 * @param media {HTMLMediaElement} - audio or video element to be controlled
		 * @param options {Object} - an object with optional settings
		 * @throws {TypeError} if options.initialVolume or options.fadeDuration are invalid
		 *
		 * options:
		 * .logger: {Function} logging `function(stuff, …)` for execution information (default: no logging)
		 * .fadeScaling: {Mixed} either 'linear', 'logarithmic' or a positive number in dB (default: logarithmic)
		 * .initialVolume: {Number} media volume 0…1 to apply during setup (volume not touched by default)
		 * .fadeDuration: {Number} time in milliseconds to complete a fade (default: 1000 ms)
		 */
		constructor(media, options) {
			// passed media element of correct type?
			if (media instanceof HTMLMediaElement) {
				// save reference to media element
				this.media = media;
			} else {
				// abort and throw an exception
				throw new TypeError("Media element expected!");
			}

			// make sure options is an object
			options = options || {};

			// log function passed?
			if (typeof options.logger == "function") {
				// set log function to the one specified
				this.logger = options.logger;
			} else {
				// set log function explicitly to false
				this.logger = false;
			}

			// linear volume fading?
			if (options.fadeScaling == "linear") {
				// pass levels unchanged
				this.scale = {
					internalToVolume: (level) => level,
					volumeToInternal: (level) => level,
				};

				// log setting
				this.logger && this.logger("Using linear fading.");
			}
			// no linear, but logarithmic fading…
			else {
				let dynamicRange;

				// default dynamic range?
				if (
					options.fadeScaling === undefined ||
					options.fadeScaling == "logarithmic"
				) {
					// set default of 60 dB
					dynamicRange = 3;
				}
				// custom dynamic range?
				else if (
					!Number.isNaN(options.fadeScaling) &&
					options.fadeScaling > 0
				) {
					// turn amplitude dB into a multiple of 10 power dB
					dynamicRange = options.fadeScaling / 2 / 10;
				}
				// unsupported value
				else {
					// abort and throw exception
					throw new TypeError(
						"Expected 'linear', 'logarithmic' or a positive number as fade scaling preference!"
					);
				}

				// use exponential/logarithmic scaler for expansion/compression
				this.scale = {
					internalToVolume: (level) =>
						this.exponentialScaler(level, dynamicRange),
					volumeToInternal: (level) =>
						this.logarithmicScaler(level, dynamicRange),
				};

				// log setting if not default
				options.fadeScaling &&
					this.logger &&
					this.logger(
						"Using logarithmic fading with " +
							String(10 * dynamicRange) +
							" dB dynamic range."
					);
			}

			// set initial volume?
			if (options.initialVolume !== undefined) {
				// validate volume level and throw if invalid
				validateVolumeLevel(options.initialVolume);

				// set initial volume
				this.media.volume = options.initialVolume;

				// log setting
				this.logger &&
					this.logger(
						"Set initial volume to " + String(this.media.volume) + "."
					);
			}

			// fade duration given?
			if (options.fadeDuration !== undefined) {
				// try to set given fade duration (will log if successful and throw if not)
				this.setFadeDuration(options.fadeDuration);
			} else {
				// set default fade duration (1000 ms)
				this.fadeDuration = 1000;
			}

			// indicate that fader is not active yet
			this.active = false;

			// initialization done
			this.logger && this.logger("Initialized for", this.media);
		}

		/**
		 * Re(start) the update cycle.
		 * (this.active must be truthy for volume updates to take effect)
		 *
		 * @return {Object} VolumeFader instance for chaining
		 */
		start() {
			// set fader to be active
			this.active = true;

			// start by running the update method
			this.updateVolume();

			// return instance for chaining
			return this;
		}

		/**
		 * Stop the update cycle.
		 * (interrupting any fade)
		 *
		 * @return {Object} VolumeFader instance for chaining
		 */
		stop() {
			// set fader to be inactive
			this.active = false;

			// return instance for chaining
			return this;
		}

		/**
		 * Set fade duration.
		 * (used for future calls to fadeTo)
		 *
		 * @param {Number} fadeDuration - fading length in milliseconds
		 * @throws {TypeError} if fadeDuration is not a number greater than zero
		 * @return {Object} VolumeFader instance for chaining
		 */
		setFadeDuration(fadeDuration) {
			// if duration is a valid number > 0…
			if (!Number.isNaN(fadeDuration) && fadeDuration > 0) {
				// set fade duration
				this.fadeDuration = fadeDuration;

				// log setting
				this.logger &&
					this.logger("Set fade duration to " + String(fadeDuration) + " ms.");
			} else {
				// abort and throw an exception
				throw new TypeError("Positive number expected as fade duration!");
			}

			// return instance for chaining
			return this;
		}

		/**
		 * Define a new fade and start fading.
		 *
		 * @param {Number} targetVolume - level to fade to in the range 0…1
		 * @param {Function} callback - (optional) function to be called when fade is complete
		 * @throws {TypeError} if targetVolume is not in the range 0…1
		 * @return {Object} VolumeFader instance for chaining
		 */
		fadeTo(targetVolume, callback) {
			// validate volume and throw if invalid
			validateVolumeLevel(targetVolume);

			// define new fade
			this.fade = {
				// volume start and end point on internal fading scale
				volume: {
					start: this.scale.volumeToInternal(this.media.volume),
					end: this.scale.volumeToInternal(targetVolume),
				},
				// time start and end point
				time: {
					start: Date.now(),
					end: Date.now() + this.fadeDuration,
				},
				// optional callback function
				callback: callback,
			};

			// start fading
			this.start();

			// log new fade
			this.logger && this.logger("New fade started:", this.fade);

			// return instance for chaining
			return this;
		}

		// convenience shorthand methods for common fades
		fadeIn(callback) {
			this.fadeTo(1, callback);
		}
		fadeOut(callback) {
			this.fadeTo(0, callback);
		}

		/**
		 * Internal: Update media volume.
		 * (calls itself through requestAnimationFrame)
		 *
		 * @param {Number} targetVolume - linear level to fade to (0…1)
		 * @param {Function} callback - (optional) function to be called when fade is complete
		 */
		updateVolume() {
			// fader active and fade available to process?
			if (this.active && this.fade) {
				// get current time
				let now = Date.now();

				// time left for fading?
				if (now < this.fade.time.end) {
					// compute current fade progress
					let progress =
						(now - this.fade.time.start) /
						(this.fade.time.end - this.fade.time.start);

					// compute current level on internal scale
					let level =
						progress * (this.fade.volume.end - this.fade.volume.start) +
						this.fade.volume.start;

					// map fade level to volume level and apply it to media element
					this.media.volume = this.scale.internalToVolume(level);

					// schedule next update
					root.requestAnimationFrame(this.updateVolume.bind(this));
				} else {
					// log end of fade
					this.logger &&
						this.logger(
							"Fade to " + String(this.fade.volume.end) + " complete."
						);

					// time is up, jump to target volume
					this.media.volume = this.scale.internalToVolume(this.fade.volume.end);

					// set fader to be inactive
					this.active = false;

					// done, call back (if callable)
					typeof this.fade.callback == "function" && this.fade.callback();

					// clear fade
					this.fade = undefined;
				}
			}
		}

		/**
		 * Internal: Exponential scaler with dynamic range limit.
		 *
		 * @param {Number} input - logarithmic input level to be expanded (float, 0…1)
		 * @param {Number} dynamicRange - expanded output range, in multiples of 10 dB (float, 0…∞)
		 * @return {Number} - expanded level (float, 0…1)
		 */
		exponentialScaler(input, dynamicRange) {
			// special case: make zero (or any falsy input) return zero
			if (input == 0) {
				// since the dynamic range is limited,
				// allow a zero to produce a plain zero instead of a small faction
				// (audio would not be recognized as silent otherwise)
				return 0;
			} else {
				// scale 0…1 to minus something × 10 dB
				input = (input - 1) * dynamicRange;

				// compute power of 10
				return Math.pow(10, input);
			}
		}

		/**
		 * Internal: Logarithmic scaler with dynamic range limit.
		 *
		 * @param {Number} input - exponential input level to be compressed (float, 0…1)
		 * @param {Number} dynamicRange - coerced input range, in multiples of 10 dB (float, 0…∞)
		 * @return {Number} - compressed level (float, 0…1)
		 */
		logarithmicScaler(input, dynamicRange) {
			// special case: make zero (or any falsy input) return zero
			if (input == 0) {
				// logarithm of zero would be -∞, which would map to zero anyway
				return 0;
			} else {
				// compute base-10 logarithm
				input = Math.log10(input);

				// scale minus something × 10 dB to 0…1 (clipping at 0)
				return Math.max(1 + input / dynamicRange, 0);
			}
		}
	}

	// export class to root scope
	root.VolumeFader = VolumeFader;
})(window);
