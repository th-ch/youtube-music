module.exports = {
	singleton,
	debounce,
	cache,
	throttle,
	memoize,
	retry,
};

/**
 * @template T
 * @param {T} fn
 * @returns {T}
 */
function singleton(fn) {
	let called = false;
	return (...args) => {
		if (called) return;
		called = true;
		return fn(...args);
	};
}

/**
 * @template T
 * @param {T} fn
 * @param {number} delay
 * @returns {T}
 */
function debounce(fn, delay) {
	let timeout;
	return (...args) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => fn(...args), delay);
	};
}

/**
 * @template T
 * @param {T} fn
 * @returns {T}
 */
function cache(fn) {
	let lastArgs;
	let lastResult;
	return (...args) => {
		if (
			args.length !== lastArgs?.length ||
			args.some((arg, i) => arg !== lastArgs[i])
		) {
			lastArgs = args;
			lastResult = fn(...args);
		}
		return lastResult;
	};
}

/*
  the following are currently unused, but potentially useful in the future
*/

/**
 * @template T
 * @param {T} fn
 * @param {number} delay
 * @returns {T}
 */
function throttle(fn, delay) {
	let timeout;
	return (...args) => {
		if (timeout) return;
		timeout = setTimeout(() => {
			timeout = undefined;
			fn(...args);
		}, delay);
	};
}

/**
 * @template T
 * @param {T} fn
 * @returns {T}
 */
function memoize(fn) {
	const cache = new Map();
	return (...args) => {
		const key = JSON.stringify(args);
		if (!cache.has(key)) {
			cache.set(key, fn(...args));
		}
		return cache.get(key);
	};
}

/**
 * @template T
 * @param {T} fn
 * @returns {T}
 */
function retry(fn, { retries = 3, delay = 1000 } = {}) {
	return (...args) => {
		try {
			return fn(...args);
		} catch (e) {
			if (retries > 0) {
				retries--;
				setTimeout(() => retry(fn, { retries, delay })(...args), delay);
			} else {
				throw e;
			}
		}
	};
}
