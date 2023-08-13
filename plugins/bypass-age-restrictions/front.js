module.exports = () => {
	// ==UserScript==
	// @name            Simple YouTube Age Restriction Bypass
	// @description     Watch age restricted videos on YouTube without login and without age verification 😎
	// @description:de  Schaue YouTube Videos mit Altersbeschränkungen ohne Anmeldung und ohne dein Alter zu bestätigen 😎
	// @description:fr  Regardez des vidéos YouTube avec des restrictions d'âge sans vous inscrire et sans confirmer votre âge 😎
	// @description:it  Guarda i video con restrizioni di età su YouTube senza login e senza verifica dell'età 😎
	// @icon            https://github.com/zerodytrash/Simple-YouTube-Age-Restriction-Bypass/raw/v2.5.4/src/extension/icon/icon_64.png
	// @version         2.5.9
	// @author          Zerody (https://github.com/zerodytrash)
	// @namespace       https://github.com/zerodytrash/Simple-YouTube-Age-Restriction-Bypass/
	// @supportURL      https://github.com/zerodytrash/Simple-YouTube-Age-Restriction-Bypass/issues
	// @updateURL       https://github.com/zerodytrash/Simple-YouTube-Age-Restriction-Bypass/raw/main/dist/Simple-YouTube-Age-Restriction-Bypass.user.js
	// @license         MIT
	// @match           https://www.youtube.com/*
	// @match           https://www.youtube-nocookie.com/*
	// @match           https://m.youtube.com/*
	// @match           https://music.youtube.com/*
	// @grant           none
	// @run-at          document-start
	// @compatible      chrome
	// @compatible      firefox
	// @compatible      opera
	// @compatible      edge
	// @compatible      safari
	// ==/UserScript==

	/*
		This is a transpiled version to achieve a clean code base and better browser compatibility.
		You can find the nicely readable source code at https://github.com/zerodytrash/Simple-YouTube-Age-Restriction-Bypass
	*/

	(function iife(ranOnce) {
		// Trick to get around the sandbox restrictions in Greasemonkey (Firefox)
		// Inject code into the main window if criteria match
		if (this !== window && !ranOnce) {
			window.eval('(' + iife.toString() + ')(true);');
			return;
		}

		// Script configuration variables
		const UNLOCKABLE_PLAYABILITY_STATUSES = ['AGE_VERIFICATION_REQUIRED', 'AGE_CHECK_REQUIRED', 'CONTENT_CHECK_REQUIRED', 'LOGIN_REQUIRED'];
		const VALID_PLAYABILITY_STATUSES = ['OK', 'LIVE_STREAM_OFFLINE'];

		// These are the proxy servers that are sometimes required to unlock videos with age restrictions.
		// You can host your own account proxy instance. See https://github.com/zerodytrash/Simple-YouTube-Age-Restriction-Bypass/tree/main/account-proxy
		// To learn what information is transferred, please read: https://github.com/zerodytrash/Simple-YouTube-Age-Restriction-Bypass#privacy
		const ACCOUNT_PROXY_SERVER_HOST = 'https://youtube-proxy.zerody.one';
		const VIDEO_PROXY_SERVER_HOST = 'https://ny.4everproxy.com';

		// User needs to confirm the unlock process on embedded player?
		let ENABLE_UNLOCK_CONFIRMATION_EMBED = true;

		// Show notification?
		let ENABLE_UNLOCK_NOTIFICATION = true;

		// Disable content warnings?
		let SKIP_CONTENT_WARNINGS = true;

		// Some Innertube bypass methods require the following authentication headers of the currently logged in user.
		const GOOGLE_AUTH_HEADER_NAMES = ['Authorization', 'X-Goog-AuthUser', 'X-Origin'];

		/**
		 * The SQP parameter length is different for blurred thumbnails.
		 * They contain much less information, than normal thumbnails.
		 * The thumbnail SQPs tend to have a long and a short version.
		 */
		const BLURRED_THUMBNAIL_SQP_LENGTHS = [
			32, // Mobile (SHORT)
			48, // Desktop Playlist (SHORT)
			56, // Desktop (SHORT)
			68, // Mobile (LONG)
			72, // Mobile Shorts
			84, // Desktop Playlist (LONG)
			88, // Desktop (LONG)
		];

		// small hack to prevent tree shaking on these exports
		var Config = window[Symbol()] = {
			UNLOCKABLE_PLAYABILITY_STATUSES,
			VALID_PLAYABILITY_STATUSES,
			ACCOUNT_PROXY_SERVER_HOST,
			VIDEO_PROXY_SERVER_HOST,
			ENABLE_UNLOCK_CONFIRMATION_EMBED,
			ENABLE_UNLOCK_NOTIFICATION,
			SKIP_CONTENT_WARNINGS,
			GOOGLE_AUTH_HEADER_NAMES,
			BLURRED_THUMBNAIL_SQP_LENGTHS,
		};

		function isGoogleVideoUrl(url) {
			return url.host.includes('.googlevideo.com');
		}

		function isGoogleVideoUnlockRequired(googleVideoUrl, lastProxiedGoogleVideoId) {
			const urlParams = new URLSearchParams(googleVideoUrl.search);
			const hasGcrFlag = urlParams.get('gcr');
			const wasUnlockedByAccountProxy = urlParams.get('id') === lastProxiedGoogleVideoId;

			return hasGcrFlag && wasUnlockedByAccountProxy;
		}

		const nativeJSONParse = window.JSON.parse;
		const nativeXMLHttpRequestOpen = window.XMLHttpRequest.prototype.open;

		const isDesktop = window.location.host !== 'm.youtube.com';
		const isMusic = window.location.host === 'music.youtube.com';
		const isEmbed = window.location.pathname.indexOf('/embed/') === 0;
		const isConfirmed = window.location.search.includes('unlock_confirmed');

		class Deferred {
			constructor() {
				return Object.assign(
					new Promise((resolve, reject) => {
						this.resolve = resolve;
						this.reject = reject;
					}),
					this,
				);
			}
		}

		function createElement(tagName, options) {
			const node = document.createElement(tagName);
			options && Object.assign(node, options);
			return node;
		}

		function isObject(obj) {
			return obj !== null && typeof obj === 'object';
		}

		function findNestedObjectsByAttributeNames(object, attributeNames) {
			var results = [];

			// Does the current object match the attribute conditions?
			if (attributeNames.every((key) => typeof object[key] !== 'undefined')) {
				results.push(object);
			}

			// Diggin' deeper for each nested object (recursive)
			Object.keys(object).forEach((key) => {
				if (object[key] && typeof object[key] === 'object') {
					results.push(...findNestedObjectsByAttributeNames(object[key], attributeNames));
				}
			});

			return results;
		}

		function pageLoaded() {
			if (document.readyState === 'complete') return Promise.resolve();

			const deferred = new Deferred();

			window.addEventListener('load', deferred.resolve, { once: true });

			return deferred;
		}

		function createDeepCopy(obj) {
			return nativeJSONParse(JSON.stringify(obj));
		}

		function getYtcfgValue(name) {
			var _window$ytcfg;
			return (_window$ytcfg = window.ytcfg) === null || _window$ytcfg === void 0 ? void 0 : _window$ytcfg.get(name);
		}

		function getSignatureTimestamp() {
			return (
				getYtcfgValue('STS')
				|| (() => {
					var _document$querySelect;
					// STS is missing on embedded player. Retrieve from player base script as fallback...
					const playerBaseJsPath = (_document$querySelect = document.querySelector('script[src*="/base.js"]')) === null || _document$querySelect === void 0
						? void 0
						: _document$querySelect.src;

					if (!playerBaseJsPath) return;

					const xmlhttp = new XMLHttpRequest();
					xmlhttp.open('GET', playerBaseJsPath, false);
					xmlhttp.send(null);

					return parseInt(xmlhttp.responseText.match(/signatureTimestamp:([0-9]*)/)[1]);
				})()
			);
		}

		function isUserLoggedIn() {
			// LOGGED_IN doesn't exist on embedded page, use DELEGATED_SESSION_ID or SESSION_INDEX as fallback
			if (typeof getYtcfgValue('LOGGED_IN') === 'boolean') return getYtcfgValue('LOGGED_IN');
			if (typeof getYtcfgValue('DELEGATED_SESSION_ID') === 'string') return true;
			if (parseInt(getYtcfgValue('SESSION_INDEX')) >= 0) return true;

			return false;
		}

		function getCurrentVideoStartTime(currentVideoId) {
			// Check if the URL corresponds to the requested video
			// This is not the case when the player gets preloaded for the next video in a playlist.
			if (window.location.href.includes(currentVideoId)) {
				var _ref;
				// "t"-param on youtu.be urls
				// "start"-param on embed player
				// "time_continue" when clicking "watch on youtube" on embedded player
				const urlParams = new URLSearchParams(window.location.search);
				const startTimeString = (_ref = urlParams.get('t') || urlParams.get('start') || urlParams.get('time_continue')) === null || _ref === void 0
					? void 0
					: _ref.replace('s', '');

				if (startTimeString && !isNaN(startTimeString)) {
					return parseInt(startTimeString);
				}
			}

			return 0;
		}

		function setUrlParams(params) {
			const urlParams = new URLSearchParams(window.location.search);
			for (const paramName in params) {
				urlParams.set(paramName, params[paramName]);
			}
			window.location.search = urlParams;
		}

		function waitForElement(elementSelector, timeout) {
			const deferred = new Deferred();

			const checkDomInterval = setInterval(() => {
				const elem = document.querySelector(elementSelector);
				if (elem) {
					clearInterval(checkDomInterval);
					deferred.resolve(elem);
				}
			}, 100);

			if (timeout) {
				setTimeout(() => {
					clearInterval(checkDomInterval);
					deferred.reject();
				}, timeout);
			}

			return deferred;
		}

		function parseRelativeUrl(url) {
			if (typeof url !== 'string') {
				return null;
			}

			if (url.indexOf('/') === 0) {
				url = window.location.origin + url;
			}

			try {
				return url.indexOf('https://') === 0 ? new window.URL(url) : null;
			} catch {
				return null;
			}
		}

		function isWatchNextObject(parsedData) {
			var _parsedData$currentVi;
			if (
				!(parsedData !== null && parsedData !== void 0 && parsedData.contents)
				|| !(parsedData !== null && parsedData !== void 0 && (_parsedData$currentVi = parsedData.currentVideoEndpoint) !== null && _parsedData$currentVi !== void 0
					&& (_parsedData$currentVi = _parsedData$currentVi.watchEndpoint) !== null && _parsedData$currentVi !== void 0 && _parsedData$currentVi.videoId)
			) return false;
			return !!parsedData.contents.twoColumnWatchNextResults || !!parsedData.contents.singleColumnWatchNextResults;
		}

		function isWatchNextSidebarEmpty(parsedData) {
			var _parsedData$contents2, _content$find;
			if (isDesktop) {
				var _parsedData$contents;
				// WEB response layout
				const result = (_parsedData$contents = parsedData.contents) === null || _parsedData$contents === void 0
						|| (_parsedData$contents = _parsedData$contents.twoColumnWatchNextResults) === null || _parsedData$contents === void 0
						|| (_parsedData$contents = _parsedData$contents.secondaryResults) === null || _parsedData$contents === void 0
						|| (_parsedData$contents = _parsedData$contents.secondaryResults) === null || _parsedData$contents === void 0
					? void 0
					: _parsedData$contents.results;
				return !result;
			}

			// MWEB response layout
			const content = (_parsedData$contents2 = parsedData.contents) === null || _parsedData$contents2 === void 0
					|| (_parsedData$contents2 = _parsedData$contents2.singleColumnWatchNextResults) === null || _parsedData$contents2 === void 0
					|| (_parsedData$contents2 = _parsedData$contents2.results) === null || _parsedData$contents2 === void 0
					|| (_parsedData$contents2 = _parsedData$contents2.results) === null || _parsedData$contents2 === void 0
				? void 0
				: _parsedData$contents2.contents;
			const result = content === null || content === void 0 || (_content$find = content.find((e) => {
						var _e$itemSectionRendere;
						return ((_e$itemSectionRendere = e.itemSectionRenderer) === null || _e$itemSectionRendere === void 0 ? void 0 : _e$itemSectionRendere.targetId)
							=== 'watch-next-feed';
					})) === null
					|| _content$find === void 0
				? void 0
				: _content$find.itemSectionRenderer;
			return typeof result !== 'object';
		}

		function isPlayerObject(parsedData) {
			return (parsedData === null || parsedData === void 0 ? void 0 : parsedData.videoDetails)
				&& (parsedData === null || parsedData === void 0 ? void 0 : parsedData.playabilityStatus);
		}

		function isEmbeddedPlayerObject(parsedData) {
			return typeof (parsedData === null || parsedData === void 0 ? void 0 : parsedData.previewPlayabilityStatus) === 'object';
		}

		function isAgeRestricted(playabilityStatus) {
			var _playabilityStatus$er;
			if (!(playabilityStatus !== null && playabilityStatus !== void 0 && playabilityStatus.status)) return false;
			if (playabilityStatus.desktopLegacyAgeGateReason) return true;
			if (Config.UNLOCKABLE_PLAYABILITY_STATUSES.includes(playabilityStatus.status)) return true;

			// Fix to detect age restrictions on embed player
			// see https://github.com/zerodytrash/Simple-YouTube-Age-Restriction-Bypass/issues/85#issuecomment-946853553
			return (
				isEmbed
				&& ((_playabilityStatus$er = playabilityStatus.errorScreen) === null || _playabilityStatus$er === void 0
						|| (_playabilityStatus$er = _playabilityStatus$er.playerErrorMessageRenderer) === null || _playabilityStatus$er === void 0
						|| (_playabilityStatus$er = _playabilityStatus$er.reason) === null || _playabilityStatus$er === void 0
						|| (_playabilityStatus$er = _playabilityStatus$er.runs) === null || _playabilityStatus$er === void 0
						|| (_playabilityStatus$er = _playabilityStatus$er.find((x) => x.navigationEndpoint)) === null || _playabilityStatus$er === void 0
						|| (_playabilityStatus$er = _playabilityStatus$er.navigationEndpoint) === null || _playabilityStatus$er === void 0
						|| (_playabilityStatus$er = _playabilityStatus$er.urlEndpoint) === null || _playabilityStatus$er === void 0
						|| (_playabilityStatus$er = _playabilityStatus$er.url) === null || _playabilityStatus$er === void 0
					? void 0
					: _playabilityStatus$er.includes('/2802167'))
			);
		}

		function isSearchResult(parsedData) {
			var _parsedData$contents3, _parsedData$contents4, _parsedData$onRespons;
			return (
				typeof (parsedData === null || parsedData === void 0 || (_parsedData$contents3 = parsedData.contents) === null || _parsedData$contents3 === void 0
						? void 0
						: _parsedData$contents3.twoColumnSearchResultsRenderer) === 'object' // Desktop initial results
				|| (parsedData === null || parsedData === void 0 || (_parsedData$contents4 = parsedData.contents) === null || _parsedData$contents4 === void 0
							|| (_parsedData$contents4 = _parsedData$contents4.sectionListRenderer) === null || _parsedData$contents4 === void 0
						? void 0
						: _parsedData$contents4.targetId) === 'search-feed' // Mobile initial results
				|| (parsedData === null || parsedData === void 0 || (_parsedData$onRespons = parsedData.onResponseReceivedCommands) === null || _parsedData$onRespons === void 0
							|| (_parsedData$onRespons = _parsedData$onRespons.find((x) => x.appendContinuationItemsAction)) === null || _parsedData$onRespons === void 0
							|| (_parsedData$onRespons = _parsedData$onRespons.appendContinuationItemsAction) === null || _parsedData$onRespons === void 0
						? void 0
						: _parsedData$onRespons.targetId) === 'search-feed' // Desktop & Mobile scroll continuation
			);
		}

		function attach$3(obj, prop, onCall) {
			if (!obj || typeof obj[prop] !== 'function') {
				return;
			}

			let original = obj[prop];

			obj[prop] = function() {
				try {
					onCall(arguments);
				} catch {}
				original.apply(this, arguments);
			};
		}

		// Intercept, inspect and modify JSON-based communication to unlock player responses by hijacking the JSON.parse function
		function attach$2(onJsonDataReceived) {
			window.JSON.parse = function() {
				const data = nativeJSONParse.apply(this, arguments);
				return isObject(data) ? onJsonDataReceived(data) : data;
			};
		}

		const logPrefix = '%cSimple-YouTube-Age-Restriction-Bypass:';
		const logPrefixStyle = 'background-color: #1e5c85; color: #fff; font-size: 1.2em;';
		const logSuffix = '\uD83D\uDC1E You can report bugs at: https://github.com/zerodytrash/Simple-YouTube-Age-Restriction-Bypass/issues';

		function error(err, msg) {
			console.error(logPrefix, logPrefixStyle, msg, err, getYtcfgDebugString(), '\n\n', logSuffix);
			if (window.SYARB_CONFIG) {
				window.dispatchEvent(
					new CustomEvent('SYARB_LOG_ERROR', {
						detail: {
							message: (msg ? msg + '; ' : '') + (err && err.message ? err.message : ''),
							stack: err && err.stack ? err.stack : null,
						},
					}),
				);
			}
		}

		function info(msg) {
			console.info(logPrefix, logPrefixStyle, msg);
			if (window.SYARB_CONFIG) {
				window.dispatchEvent(
					new CustomEvent('SYARB_LOG_INFO', {
						detail: {
							message: msg,
						},
					}),
				);
			}
		}

		function getYtcfgDebugString() {
			try {
				return (
					`InnertubeConfig: `
					+ `innertubeApiKey: ${getYtcfgValue('INNERTUBE_API_KEY')} `
					+ `innertubeClientName: ${getYtcfgValue('INNERTUBE_CLIENT_NAME')} `
					+ `innertubeClientVersion: ${getYtcfgValue('INNERTUBE_CLIENT_VERSION')} `
					+ `loggedIn: ${getYtcfgValue('LOGGED_IN')} `
				);
			} catch (err) {
				return `Failed to access config: ${err}`;
			}
		}

		function attach$1(onRequestCreate) {
			if (typeof window.Request !== 'function') {
				return;
			}

			window.Request = new Proxy(window.Request, {
				construct(target, args) {
					const [url, options] = args;
					try {
						const parsedUrl = parseRelativeUrl(url);
						const modifiedUrl = onRequestCreate(parsedUrl, options);

						if (modifiedUrl) {
							args[0] = modifiedUrl.toString();
						}
					} catch (err) {
						error(err, `Failed to intercept Request()`);
					}

					return Reflect.construct(...arguments);
				},
			});
		}

		function attach(onXhrOpenCalled) {
			XMLHttpRequest.prototype.open = function(method, url) {
				try {
					let parsedUrl = parseRelativeUrl(url);

					if (parsedUrl) {
						const modifiedUrl = onXhrOpenCalled(method, parsedUrl, this);

						if (modifiedUrl) {
							arguments[1] = modifiedUrl.toString();
						}
					}
				} catch (err) {
					error(err, `Failed to intercept XMLHttpRequest.open()`);
				}

				nativeXMLHttpRequestOpen.apply(this, arguments);
			};
		}

		const localStoragePrefix = 'SYARB_';

		function set(key, value) {
			localStorage.setItem(localStoragePrefix + key, JSON.stringify(value));
		}

		function get(key) {
			try {
				return JSON.parse(localStorage.getItem(localStoragePrefix + key));
			} catch {
				return null;
			}
		}

		function getPlayer$1(payload, useAuth) {
			return sendInnertubeRequest('v1/player', payload, useAuth);
		}

		function getNext$1(payload, useAuth) {
			return sendInnertubeRequest('v1/next', payload, useAuth);
		}

		function sendInnertubeRequest(endpoint, payload, useAuth) {
			const xmlhttp = new XMLHttpRequest();
			xmlhttp.open('POST', `/youtubei/${endpoint}?key=${getYtcfgValue('INNERTUBE_API_KEY')}&prettyPrint=false`, false);

			if (useAuth && isUserLoggedIn()) {
				xmlhttp.withCredentials = true;
				Config.GOOGLE_AUTH_HEADER_NAMES.forEach((headerName) => {
					xmlhttp.setRequestHeader(headerName, get(headerName));
				});
			}

			xmlhttp.send(JSON.stringify(payload));
			return nativeJSONParse(xmlhttp.responseText);
		}

		var innertube = {
			getPlayer: getPlayer$1,
			getNext: getNext$1,
		};

		let nextResponseCache = {};

		function getGoogleVideoUrl(originalUrl) {
			return Config.VIDEO_PROXY_SERVER_HOST + '/direct/' + btoa(originalUrl.toString());
		}

		function getPlayer(payload) {
			// Also request the /next response if a later /next request is likely.
			if (!nextResponseCache[payload.videoId] && !isMusic && !isEmbed) {
				payload.includeNext = 1;
			}

			return sendRequest('getPlayer', payload);
		}

		function getNext(payload) {
			// Next response already cached? => Return cached content
			if (nextResponseCache[payload.videoId]) {
				return nextResponseCache[payload.videoId];
			}

			return sendRequest('getNext', payload);
		}

		function sendRequest(endpoint, payload) {
			const queryParams = new URLSearchParams(payload);
			const proxyUrl = `${Config.ACCOUNT_PROXY_SERVER_HOST}/${endpoint}?${queryParams}&client=js`;

			try {
				const xmlhttp = new XMLHttpRequest();
				xmlhttp.open('GET', proxyUrl, false);
				xmlhttp.send(null);

				const proxyResponse = nativeJSONParse(xmlhttp.responseText);

				// Mark request as 'proxied'
				proxyResponse.proxied = true;

				// Put included /next response in the cache
				if (proxyResponse.nextResponse) {
					nextResponseCache[payload.videoId] = proxyResponse.nextResponse;
					delete proxyResponse.nextResponse;
				}

				return proxyResponse;
			} catch (err) {
				error(err, 'Proxy API Error');
				return { errorMessage: 'Proxy Connection failed' };
			}
		}

		var proxy = {
			getPlayer,
			getNext,
			getGoogleVideoUrl,
		};

		function getUnlockStrategies$1(videoId, lastPlayerUnlockReason) {
			var _getYtcfgValue$client;
			const clientName = getYtcfgValue('INNERTUBE_CLIENT_NAME') || 'WEB';
			const clientVersion = getYtcfgValue('INNERTUBE_CLIENT_VERSION') || '2.20220203.04.00';
			const hl = getYtcfgValue('HL');
			const userInterfaceTheme = (_getYtcfgValue$client = getYtcfgValue('INNERTUBE_CONTEXT').client.userInterfaceTheme) !== null && _getYtcfgValue$client !== void 0
				? _getYtcfgValue$client
				: document.documentElement.hasAttribute('dark')
				? 'USER_INTERFACE_THEME_DARK'
				: 'USER_INTERFACE_THEME_LIGHT';

			return [
				/**
				 * Retrieve the sidebar and video description by just adding `racyCheckOk` and `contentCheckOk` params
				 * This strategy can be used to bypass content warnings
				 */
				{
					name: 'Content Warning Bypass',
					skip: !lastPlayerUnlockReason || !lastPlayerUnlockReason.includes('CHECK_REQUIRED'),
					optionalAuth: true,
					payload: {
						context: {
							client: {
								clientName,
								clientVersion,
								hl,
								userInterfaceTheme,
							},
						},
						videoId,
						racyCheckOk: true,
						contentCheckOk: true,
					},
					endpoint: innertube,
				},
				/**
				 * Retrieve the sidebar and video description from an account proxy server.
				 * Session cookies of an age-verified Google account are stored on server side.
				 * See https://github.com/zerodytrash/Simple-YouTube-Age-Restriction-Bypass/tree/main/account-proxy
				 */
				{
					name: 'Account Proxy',
					payload: {
						videoId,
						clientName,
						clientVersion,
						hl,
						userInterfaceTheme,
						isEmbed: +isEmbed,
						isConfirmed: +isConfirmed,
					},
					endpoint: proxy,
				},
			];
		}

		function getUnlockStrategies(videoId, reason) {
			const clientName = getYtcfgValue('INNERTUBE_CLIENT_NAME') || 'WEB';
			const clientVersion = getYtcfgValue('INNERTUBE_CLIENT_VERSION') || '2.20220203.04.00';
			const signatureTimestamp = getSignatureTimestamp();
			const startTimeSecs = getCurrentVideoStartTime(videoId);
			const hl = getYtcfgValue('HL');

			return [
				/**
				 * Retrieve the video info by just adding `racyCheckOk` and `contentCheckOk` params
				 * This strategy can be used to bypass content warnings
				 */
				{
					name: 'Content Warning Bypass',
					skip: !reason || !reason.includes('CHECK_REQUIRED'),
					optionalAuth: true,
					payload: {
						context: {
							client: {
								clientName: clientName,
								clientVersion: clientVersion,
								hl,
							},
						},
						playbackContext: {
							contentPlaybackContext: {
								signatureTimestamp,
							},
						},
						videoId,
						startTimeSecs,
						racyCheckOk: true,
						contentCheckOk: true,
					},
					endpoint: innertube,
				},
				/**
				 * Retrieve the video info by using the TVHTML5 Embedded client
				 * This client has no age restrictions in place (2022-03-28)
				 * See https://github.com/zerodytrash/YouTube-Internal-Clients
				 */
				{
					name: 'TV Embedded Player',
					requiresAuth: false,
					payload: {
						context: {
							client: {
								clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
								clientVersion: '2.0',
								clientScreen: 'WATCH',
								hl,
							},
							thirdParty: {
								embedUrl: 'https://www.youtube.com/',
							},
						},
						playbackContext: {
							contentPlaybackContext: {
								signatureTimestamp,
							},
						},
						videoId,
						startTimeSecs,
						racyCheckOk: true,
						contentCheckOk: true,
					},
					endpoint: innertube,
				},
				/**
				 * Retrieve the video info by using the WEB_CREATOR client in combination with user authentication
				 * Requires that the user is logged in. Can bypass the tightened age verification in the EU.
				 * See https://github.com/yt-dlp/yt-dlp/pull/600
				 */
				{
					name: 'Creator + Auth',
					requiresAuth: true,
					payload: {
						context: {
							client: {
								clientName: 'WEB_CREATOR',
								clientVersion: '1.20210909.07.00',
								hl,
							},
						},
						playbackContext: {
							contentPlaybackContext: {
								signatureTimestamp,
							},
						},
						videoId,
						startTimeSecs,
						racyCheckOk: true,
						contentCheckOk: true,
					},
					endpoint: innertube,
				},
				/**
				 * Retrieve the video info from an account proxy server.
				 * Session cookies of an age-verified Google account are stored on server side.
				 * See https://github.com/zerodytrash/Simple-YouTube-Age-Restriction-Bypass/tree/main/account-proxy
				 */
				{
					name: 'Account Proxy',
					payload: {
						videoId,
						reason,
						clientName,
						clientVersion,
						signatureTimestamp,
						startTimeSecs,
						hl,
						isEmbed: +isEmbed,
						isConfirmed: +isConfirmed,
					},
					endpoint: proxy,
				},
			];
		}

		var buttonTemplate =
			'<div style="margin-top: 15px !important; padding: 3px 10px 3px 10px; margin: 0px auto; background-color: #4d4d4d; width: fit-content; font-size: 1.2em; text-transform: uppercase; border-radius: 3px; cursor: pointer;">\n    <div class="button-text"></div>\n</div>';

		let buttons = {};

		async function addButton(id, text, backgroundColor, onClick) {
			const errorScreenElement = await waitForElement('.ytp-error', 2000);
			const buttonElement = createElement('div', { class: 'button-container', innerHTML: buttonTemplate });
			buttonElement.getElementsByClassName('button-text')[0].innerText = text;

			if (backgroundColor) {
				buttonElement.querySelector(':scope > div').style['background-color'] = backgroundColor;
			}

			if (typeof onClick === 'function') {
				buttonElement.addEventListener('click', onClick);
			}

			// Button already attached?
			if (buttons[id] && buttons[id].isConnected) {
				return;
			}

			buttons[id] = buttonElement;
			errorScreenElement.append(buttonElement);
		}

		function removeButton(id) {
			if (buttons[id] && buttons[id].isConnected) {
				buttons[id].remove();
			}
		}

		const confirmationButtonId = 'confirmButton';
		const confirmationButtonText = 'Click to unlock';

		function isConfirmationRequired() {
			return !isConfirmed && isEmbed && Config.ENABLE_UNLOCK_CONFIRMATION_EMBED;
		}

		function requestConfirmation() {
			addButton(confirmationButtonId, confirmationButtonText, null, () => {
				removeButton(confirmationButtonId);
				confirm();
			});
		}

		function confirm() {
			setUrlParams({
				unlock_confirmed: 1,
				autoplay: 1,
			});
		}

		var tDesktop = '<tp-yt-paper-toast></tp-yt-paper-toast>\n';

		var tMobile =
			'<c3-toast>\n    <ytm-notification-action-renderer>\n        <div class="notification-action-response-text"></div>\n    </ytm-notification-action-renderer>\n</c3-toast>\n';

		const template = isDesktop ? tDesktop : tMobile;

		const nToastContainer = createElement('div', { id: 'toast-container', innerHTML: template });
		const nToast = nToastContainer.querySelector(':scope > *');

		// On YT Music show the toast above the player controls
		if (isMusic) {
			nToast.style['margin-bottom'] = '85px';
		}

		if (!isDesktop) {
			nToast.nMessage = nToast.querySelector('.notification-action-response-text');
			nToast.show = (message) => {
				nToast.nMessage.innerText = message;
				nToast.setAttribute('dir', 'in');
				setTimeout(() => {
					nToast.setAttribute('dir', 'out');
				}, nToast.duration + 225);
			};
		}

		async function show(message, duration = 5) {
			if (!Config.ENABLE_UNLOCK_NOTIFICATION) return;
			if (isEmbed) return;

			await pageLoaded();

			// Do not show notification when tab is in background
			if (document.visibilityState === 'hidden') return;

			// Append toast container to DOM, if not already done
			if (!nToastContainer.isConnected) document.documentElement.append(nToastContainer);

			nToast.duration = duration * 1000;
			nToast.show(message);
		}

		var Toast = { show };

		const messagesMap = {
			success: 'Age-restricted video successfully unlocked!',
			fail: 'Unable to unlock this video 🙁 - More information in the developer console',
		};

		let lastPlayerUnlockVideoId = null;
		let lastPlayerUnlockReason = null;

		let lastProxiedGoogleVideoUrlParams;
		let cachedPlayerResponse = {};

		function getLastProxiedGoogleVideoId() {
			var _lastProxiedGoogleVid;
			return (_lastProxiedGoogleVid = lastProxiedGoogleVideoUrlParams) === null || _lastProxiedGoogleVid === void 0 ? void 0 : _lastProxiedGoogleVid.get('id');
		}

		function unlockResponse$1(playerResponse) {
			var _playerResponse$video, _playerResponse$playa, _playerResponse$previ, _unlockedPlayerRespon, _unlockedPlayerRespon3;
			// Check if the user has to confirm the unlock first
			if (isConfirmationRequired()) {
				info('Unlock confirmation required.');
				requestConfirmation();
				return;
			}

			const videoId = ((_playerResponse$video = playerResponse.videoDetails) === null || _playerResponse$video === void 0 ? void 0 : _playerResponse$video.videoId)
				|| getYtcfgValue('PLAYER_VARS').video_id;
			const reason = ((_playerResponse$playa = playerResponse.playabilityStatus) === null || _playerResponse$playa === void 0 ? void 0 : _playerResponse$playa.status)
				|| ((_playerResponse$previ = playerResponse.previewPlayabilityStatus) === null || _playerResponse$previ === void 0 ? void 0 : _playerResponse$previ.status);

			if (!Config.SKIP_CONTENT_WARNINGS && reason.includes('CHECK_REQUIRED')) {
				info(`SKIP_CONTENT_WARNINGS disabled and ${reason} status detected.`);
				return;
			}

			lastPlayerUnlockVideoId = videoId;
			lastPlayerUnlockReason = reason;

			const unlockedPlayerResponse = getUnlockedPlayerResponse(videoId, reason);

			// account proxy error?
			if (unlockedPlayerResponse.errorMessage) {
				Toast.show(`${messagesMap.fail} (ProxyError)`, 10);
				throw new Error(`Player Unlock Failed, Proxy Error Message: ${unlockedPlayerResponse.errorMessage}`);
			}

			// check if the unlocked response isn't playable
			if (
				!Config.VALID_PLAYABILITY_STATUSES.includes(
					(_unlockedPlayerRespon = unlockedPlayerResponse.playabilityStatus) === null || _unlockedPlayerRespon === void 0 ? void 0 : _unlockedPlayerRespon.status,
				)
			) {
				var _unlockedPlayerRespon2;
				Toast.show(`${messagesMap.fail} (PlayabilityError)`, 10);
				throw new Error(
					`Player Unlock Failed, playabilityStatus: ${
						(_unlockedPlayerRespon2 = unlockedPlayerResponse.playabilityStatus) === null || _unlockedPlayerRespon2 === void 0 ? void 0 : _unlockedPlayerRespon2.status
					}`,
				);
			}

			// if the video info was retrieved via proxy, store the URL params from the url-attribute to detect later if the requested video file (googlevideo.com) need a proxy.
			if (
				unlockedPlayerResponse.proxied && (_unlockedPlayerRespon3 = unlockedPlayerResponse.streamingData) !== null && _unlockedPlayerRespon3 !== void 0
				&& _unlockedPlayerRespon3.adaptiveFormats
			) {
				var _unlockedPlayerRespon4, _unlockedPlayerRespon5;
				const cipherText = (_unlockedPlayerRespon4 = unlockedPlayerResponse.streamingData.adaptiveFormats.find((x) =>
								x.signatureCipher
							)) === null || _unlockedPlayerRespon4 === void 0
					? void 0
					: _unlockedPlayerRespon4.signatureCipher;
				const videoUrl = cipherText
					? new URLSearchParams(cipherText).get('url')
					: (_unlockedPlayerRespon5 = unlockedPlayerResponse.streamingData.adaptiveFormats.find((x) => x.url)) === null || _unlockedPlayerRespon5 === void 0
					? void 0
					: _unlockedPlayerRespon5.url;

				lastProxiedGoogleVideoUrlParams = videoUrl ? new URLSearchParams(new window.URL(videoUrl).search) : null;
			}

			// Overwrite the embedded (preview) playabilityStatus with the unlocked one
			if (playerResponse.previewPlayabilityStatus) {
				playerResponse.previewPlayabilityStatus = unlockedPlayerResponse.playabilityStatus;
			}

			// Transfer all unlocked properties to the original player response
			Object.assign(playerResponse, unlockedPlayerResponse);

			playerResponse.unlocked = true;

			Toast.show(messagesMap.success);
		}

		function getUnlockedPlayerResponse(videoId, reason) {
			// Check if response is cached
			if (cachedPlayerResponse.videoId === videoId) return createDeepCopy(cachedPlayerResponse);

			const unlockStrategies = getUnlockStrategies(videoId, reason);

			let unlockedPlayerResponse = {};

			// Try every strategy until one of them works
			unlockStrategies.every((strategy, index) => {
				var _unlockedPlayerRespon6;
				// Skip strategy if authentication is required and the user is not logged in
				if (strategy.skip || strategy.requiresAuth && !isUserLoggedIn()) return true;

				info(`Trying Player Unlock Method #${index + 1} (${strategy.name})`);

				try {
					unlockedPlayerResponse = strategy.endpoint.getPlayer(strategy.payload, strategy.requiresAuth || strategy.optionalAuth);
				} catch (err) {
					error(err, `Player Unlock Method ${index + 1} failed with exception`);
				}

				const isStatusValid = Config.VALID_PLAYABILITY_STATUSES.includes(
					(_unlockedPlayerRespon6 = unlockedPlayerResponse) === null || _unlockedPlayerRespon6 === void 0
						|| (_unlockedPlayerRespon6 = _unlockedPlayerRespon6.playabilityStatus) === null || _unlockedPlayerRespon6 === void 0
						? void 0
						: _unlockedPlayerRespon6.status,
				);

				if (isStatusValid) {
					var _unlockedPlayerRespon7;
					/**
					 * Workaround: https://github.com/zerodytrash/Simple-YouTube-Age-Restriction-Bypass/issues/191
					 *
					 * YouTube checks if the `trackingParams` in the response matches the decoded `trackingParam` in `responseContext.mainAppWebResponseContext`.
					 * However, sometimes the response does not include the `trackingParam` in the `responseContext`, causing the check to fail.
					 *
					 * This workaround addresses the issue by hardcoding the `trackingParams` in the response context.
					 */
					if (
						!unlockedPlayerResponse.trackingParams
						|| !((_unlockedPlayerRespon7 = unlockedPlayerResponse.responseContext) !== null && _unlockedPlayerRespon7 !== void 0
							&& (_unlockedPlayerRespon7 = _unlockedPlayerRespon7.mainAppWebResponseContext) !== null && _unlockedPlayerRespon7 !== void 0
							&& _unlockedPlayerRespon7.trackingParam)
					) {
						unlockedPlayerResponse.trackingParams = 'CAAQu2kiEwjor8uHyOL_AhWOvd4KHavXCKw=';
						unlockedPlayerResponse.responseContext = {
							mainAppWebResponseContext: {
								trackingParam: 'kx_fmPxhoPZRzgL8kzOwANUdQh8ZwHTREkw2UqmBAwpBYrzRgkuMsNLBwOcCE59TDtslLKPQ-SS',
							},
						};
					}

					/**
					 * Workaround: Account proxy response currently does not include `playerConfig`
					 *
					 * Stays here until we rewrite the account proxy to only include the necessary and bare minimum response
					 */
					if (strategy.payload.startTimeSecs && strategy.name === 'Account Proxy') {
						unlockedPlayerResponse.playerConfig = {
							playbackStartConfig: {
								startSeconds: strategy.payload.startTimeSecs,
							},
						};
					}
				}

				return !isStatusValid;
			});

			// Cache response to prevent a flood of requests in case youtube processes a blocked response mutiple times.
			cachedPlayerResponse = { videoId, ...createDeepCopy(unlockedPlayerResponse) };

			return unlockedPlayerResponse;
		}

		let cachedNextResponse = {};

		function unlockResponse(originalNextResponse) {
			const videoId = originalNextResponse.currentVideoEndpoint.watchEndpoint.videoId;

			if (!videoId) {
				throw new Error(`Missing videoId in nextResponse`);
			}

			// Only unlock the /next response when the player has been unlocked as well
			if (videoId !== lastPlayerUnlockVideoId) {
				return;
			}

			const unlockedNextResponse = getUnlockedNextResponse(videoId);

			// check if the sidebar of the unlocked response is still empty
			if (isWatchNextSidebarEmpty(unlockedNextResponse)) {
				throw new Error(`Sidebar Unlock Failed`);
			}

			// Transfer some parts of the unlocked response to the original response
			mergeNextResponse(originalNextResponse, unlockedNextResponse);
		}

		function getUnlockedNextResponse(videoId) {
			// Check if response is cached
			if (cachedNextResponse.videoId === videoId) return createDeepCopy(cachedNextResponse);

			const unlockStrategies = getUnlockStrategies$1(videoId, lastPlayerUnlockReason);

			let unlockedNextResponse = {};

			// Try every strategy until one of them works
			unlockStrategies.every((strategy, index) => {
				if (strategy.skip) return true;

				info(`Trying Next Unlock Method #${index + 1} (${strategy.name})`);

				try {
					unlockedNextResponse = strategy.endpoint.getNext(strategy.payload, strategy.optionalAuth);
				} catch (err) {
					error(err, `Next Unlock Method ${index + 1} failed with exception`);
				}

				return isWatchNextSidebarEmpty(unlockedNextResponse);
			});

			// Cache response to prevent a flood of requests in case youtube processes a blocked response mutiple times.
			cachedNextResponse = { videoId, ...createDeepCopy(unlockedNextResponse) };

			return unlockedNextResponse;
		}

		function mergeNextResponse(originalNextResponse, unlockedNextResponse) {
			var _unlockedNextResponse;
			if (isDesktop) {
				// Transfer WatchNextResults to original response
				originalNextResponse.contents.twoColumnWatchNextResults.secondaryResults = unlockedNextResponse.contents.twoColumnWatchNextResults.secondaryResults;

				// Transfer video description to original response
				const originalVideoSecondaryInfoRenderer = originalNextResponse.contents.twoColumnWatchNextResults.results.results.contents.find(
					(x) => x.videoSecondaryInfoRenderer,
				).videoSecondaryInfoRenderer;
				const unlockedVideoSecondaryInfoRenderer = unlockedNextResponse.contents.twoColumnWatchNextResults.results.results.contents.find(
					(x) => x.videoSecondaryInfoRenderer,
				).videoSecondaryInfoRenderer;

				// TODO: Throw if description not found?
				if (unlockedVideoSecondaryInfoRenderer.description) {
					originalVideoSecondaryInfoRenderer.description = unlockedVideoSecondaryInfoRenderer.description;
				} else if (unlockedVideoSecondaryInfoRenderer.attributedDescription) {
					originalVideoSecondaryInfoRenderer.attributedDescription = unlockedVideoSecondaryInfoRenderer.attributedDescription;
				}

				return;
			}

			// Transfer WatchNextResults to original response
			const unlockedWatchNextFeed = (_unlockedNextResponse = unlockedNextResponse.contents) === null || _unlockedNextResponse === void 0
					|| (_unlockedNextResponse = _unlockedNextResponse.singleColumnWatchNextResults) === null || _unlockedNextResponse === void 0
					|| (_unlockedNextResponse = _unlockedNextResponse.results) === null || _unlockedNextResponse === void 0
					|| (_unlockedNextResponse = _unlockedNextResponse.results) === null || _unlockedNextResponse === void 0
					|| (_unlockedNextResponse = _unlockedNextResponse.contents) === null || _unlockedNextResponse === void 0
				? void 0
				: _unlockedNextResponse.find(
					(x) => {
						var _x$itemSectionRendere;
						return ((_x$itemSectionRendere = x.itemSectionRenderer) === null || _x$itemSectionRendere === void 0 ? void 0 : _x$itemSectionRendere.targetId)
							=== 'watch-next-feed';
					},
				);

			if (unlockedWatchNextFeed) originalNextResponse.contents.singleColumnWatchNextResults.results.results.contents.push(unlockedWatchNextFeed);

			// Transfer video description to original response
			const originalStructuredDescriptionContentRenderer = originalNextResponse.engagementPanels
				.find((x) => x.engagementPanelSectionListRenderer)
				.engagementPanelSectionListRenderer.content.structuredDescriptionContentRenderer.items.find((x) => x.expandableVideoDescriptionBodyRenderer);
			const unlockedStructuredDescriptionContentRenderer = unlockedNextResponse.engagementPanels
				.find((x) => x.engagementPanelSectionListRenderer)
				.engagementPanelSectionListRenderer.content.structuredDescriptionContentRenderer.items.find((x) => x.expandableVideoDescriptionBodyRenderer);

			if (unlockedStructuredDescriptionContentRenderer.expandableVideoDescriptionBodyRenderer) {
				originalStructuredDescriptionContentRenderer.expandableVideoDescriptionBodyRenderer =
					unlockedStructuredDescriptionContentRenderer.expandableVideoDescriptionBodyRenderer;
			}
		}

		/**
		 *  Handles XMLHttpRequests and
		 * - Rewrite Googlevideo URLs to Proxy URLs (if necessary)
		 * - Store auth headers for the authentication of further unlock requests.
		 * - Add "content check ok" flags to request bodys
		 */
		function handleXhrOpen(method, url, xhr) {
			let proxyUrl = unlockGoogleVideo(url);
			if (proxyUrl) {
				// Exclude credentials from XMLHttpRequest
				Object.defineProperty(xhr, 'withCredentials', {
					set: () => {},
					get: () => false,
				});
				return proxyUrl;
			}

			if (url.pathname.indexOf('/youtubei/') === 0) {
				// Store auth headers in storage for further usage.
				attach$3(xhr, 'setRequestHeader', ([headerName, headerValue]) => {
					if (Config.GOOGLE_AUTH_HEADER_NAMES.includes(headerName)) {
						set(headerName, headerValue);
					}
				});
			}

			if (Config.SKIP_CONTENT_WARNINGS && method === 'POST' && ['/youtubei/v1/player', '/youtubei/v1/next'].includes(url.pathname)) {
				// Add content check flags to player and next request (this will skip content warnings)
				attach$3(xhr, 'send', (args) => {
					if (typeof args[0] === 'string') {
						args[0] = setContentCheckOk(args[0]);
					}
				});
			}
		}

		/**
		 *  Handles Fetch requests and
		 * - Rewrite Googlevideo URLs to Proxy URLs (if necessary)
		 * - Store auth headers for the authentication of further unlock requests.
		 * - Add "content check ok" flags to request bodys
		 */
		function handleFetchRequest(url, requestOptions) {
			let newGoogleVideoUrl = unlockGoogleVideo(url);
			if (newGoogleVideoUrl) {
				// Exclude credentials from Fetch Request
				if (requestOptions.credentials) {
					requestOptions.credentials = 'omit';
				}
				return newGoogleVideoUrl;
			}

			if (url.pathname.indexOf('/youtubei/') === 0 && isObject(requestOptions.headers)) {
				// Store auth headers in authStorage for further usage.
				for (let headerName in requestOptions.headers) {
					if (Config.GOOGLE_AUTH_HEADER_NAMES.includes(headerName)) {
						set(headerName, requestOptions.headers[headerName]);
					}
				}
			}

			if (Config.SKIP_CONTENT_WARNINGS && ['/youtubei/v1/player', '/youtubei/v1/next'].includes(url.pathname)) {
				// Add content check flags to player and next request (this will skip content warnings)
				requestOptions.body = setContentCheckOk(requestOptions.body);
			}
		}

		/**
		 * If the account proxy was used to retrieve the video info, the following applies:
		 * some video files (mostly music videos) can only be accessed from IPs in the same country as the innertube api request (/youtubei/v1/player) was made.
		 * to get around this, the googlevideo URL will be replaced with a web-proxy URL in the same country (US).
		 * this is only required if the "gcr=[countrycode]" flag is set in the googlevideo-url...
		 * @returns The rewitten url (if a proxy is required)
		 */
		function unlockGoogleVideo(url) {
			if (Config.VIDEO_PROXY_SERVER_HOST && isGoogleVideoUrl(url)) {
				if (isGoogleVideoUnlockRequired(url, getLastProxiedGoogleVideoId())) {
					return proxy.getGoogleVideoUrl(url);
				}
			}
		}

		/**
		 * Adds `contentCheckOk` and `racyCheckOk` to the given json data (if the data contains a video id)
		 * @returns {string} The modified json
		 */
		function setContentCheckOk(bodyJson) {
			try {
				let parsedBody = JSON.parse(bodyJson);
				if (parsedBody.videoId) {
					parsedBody.contentCheckOk = true;
					parsedBody.racyCheckOk = true;
					return JSON.stringify(parsedBody);
				}
			} catch {}
			return bodyJson;
		}

		function processThumbnails(responseObject) {
			const thumbnails = findNestedObjectsByAttributeNames(responseObject, ['url', 'height']);

			let blurredThumbnailCount = 0;

			for (const thumbnail of thumbnails) {
				if (isThumbnailBlurred(thumbnail)) {
					blurredThumbnailCount++;
					thumbnail.url = thumbnail.url.split('?')[0];
				}
			}

			info(blurredThumbnailCount + '/' + thumbnails.length + ' thumbnails detected as blurred.');
		}

		function isThumbnailBlurred(thumbnail) {
			const hasSQPParam = thumbnail.url.indexOf('?sqp=') !== -1;

			if (!hasSQPParam) {
				return false;
			}

			const SQPLength = new URL(thumbnail.url).searchParams.get('sqp').length;
			const isBlurred = Config.BLURRED_THUMBNAIL_SQP_LENGTHS.includes(SQPLength);

			return isBlurred;
		}

		try {
			attach$2(processYtData);
			attach(handleXhrOpen);
			attach$1(handleFetchRequest);
		} catch (err) {
			error(err, 'Error while attaching data interceptors');
		}

		function processYtData(ytData) {
			try {
				// Player Unlock #1: Initial page data structure and response from `/youtubei/v1/player` XHR request
				if (isPlayerObject(ytData) && isAgeRestricted(ytData.playabilityStatus)) {
					unlockResponse$1(ytData);
				} // Player Unlock #2: Embedded Player inital data structure
				else if (isEmbeddedPlayerObject(ytData) && isAgeRestricted(ytData.previewPlayabilityStatus)) {
					unlockResponse$1(ytData);
				}
			} catch (err) {
				error(err, 'Video unlock failed');
			}

			try {
				// Unlock sidebar watch next feed (sidebar) and video description
				if (isWatchNextObject(ytData) && isWatchNextSidebarEmpty(ytData)) {
					unlockResponse(ytData);
				}

				// Mobile version
				if (isWatchNextObject(ytData.response) && isWatchNextSidebarEmpty(ytData.response)) {
					unlockResponse(ytData.response);
				}
			} catch (err) {
				error(err, 'Sidebar unlock failed');
			}

			try {
				// Unlock blurry video thumbnails in search results
				if (isSearchResult(ytData)) {
					processThumbnails(ytData);
				}
			} catch (err) {
				error(err, 'Thumbnail unlock failed');
			}

			return ytData;
		}
	})();
};
