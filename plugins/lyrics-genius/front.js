const { ipcRenderer } = require("electron");
const is = require("electron-is");

module.exports = () => {
	ipcRenderer.on("update-song-info", (_, extractedSongInfo) => {
		const lyricsTab = document.querySelector('tp-yt-paper-tab[tabindex="-1"]');

		// Check if disabled
		if (!lyricsTab || !lyricsTab.hasAttribute("disabled")) {
			return;
		}

		const html = ipcRenderer.sendSync(
			"search-genius-lyrics",
			extractedSongInfo
		);
		if (!html) {
			return;
		} else if (is.dev()) {
			console.log("Fetched lyrics from Genius");
		}

		const wrapper = document.createElement("div");
		wrapper.innerHTML = html;
		const lyricsSelector1 = wrapper.querySelector(".lyrics");
		const lyricsSelector2 = wrapper.querySelector(
			'[class^="Lyrics__Container"]'
		);
		const lyrics = lyricsSelector1
			? lyricsSelector1.innerHTML
			: lyricsSelector2
			? lyricsSelector2.innerHTML
			: null;
		if (!lyrics) {
			return;
		}

		lyricsTab.removeAttribute("disabled");
		lyricsTab.removeAttribute("aria-disabled");
		document.querySelector("tp-yt-paper-tab").onclick = () => {
			lyricsTab.removeAttribute("disabled");
			lyricsTab.removeAttribute("aria-disabled");
		};

		lyricsTab.onclick = () => {
			const tabContainer = document.querySelector("ytmusic-tab-renderer");
			const observer = new MutationObserver((_, observer) => {
				const lyricsContainer = document.querySelector(
					'[page-type="MUSIC_PAGE_TYPE_TRACK_LYRICS"] > ytmusic-message-renderer'
				);
				if (lyricsContainer) {
					lyricsContainer.innerHTML = `<div id="contents" class="style-scope ytmusic-section-list-renderer genius-lyrics">
			 			${lyrics}

			 			<yt-formatted-string class="footer style-scope ytmusic-description-shelf-renderer">Source&nbsp;: Genius</yt-formatted-string>
					</div>`;
					observer.disconnect();
				}
			});
			observer.observe(tabContainer, {
				attributes: true,
				childList: true,
				subtree: true,
			});
		};
	});
};
