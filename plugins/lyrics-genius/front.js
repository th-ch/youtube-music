const { ipcRenderer } = require("electron");
const is = require("electron-is");

module.exports = () => {
	ipcRenderer.on("update-song-info", (_, extractedSongInfo) => {
		const tabList = document.querySelectorAll("tp-yt-paper-tab");
		const tabs = {
			upNext: tabList[0],
			lyrics: tabList[1],
			discover: tabList[2],
		}

		// Check if disabled
		if (!tabs.lyrics || !tabs.lyrics.hasAttribute("disabled")) {
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

		tabs.lyrics.removeAttribute("disabled");
		tabs.lyrics.removeAttribute("aria-disabled");

		for (tab of [tabs.upNext, tabs.discover]){
			tab.onclick = () => {
				tabs.lyrics.removeAttribute("disabled");
				tabs.lyrics.removeAttribute("aria-disabled");
			};
		}

		checkLyricsContainer();

		tabs.lyrics.onclick = () => {
			const tabContainer = document.querySelector("ytmusic-tab-renderer");
			const observer = new MutationObserver((_, observer) => {
				checkLyricsContainer(() => observer.disconnect());
			});
			observer.observe(tabContainer, {
				attributes: true,
				childList: true,
				subtree: true,
			});
		};

		function checkLyricsContainer(callback = () => {}) {
			const lyricsContainer = document.querySelector(
				'[page-type="MUSIC_PAGE_TYPE_TRACK_LYRICS"] > ytmusic-message-renderer'
			);
			if (lyricsContainer) {
				callback();
				setLyrics(lyricsContainer)
			}
		}

		function setLyrics(lyricsContainer){
			lyricsContainer.innerHTML = `<div id="contents" class="style-scope ytmusic-section-list-renderer description ytmusic-description-shelf-renderer genius-lyrics">
			 			${lyrics}

			 			<yt-formatted-string class="footer style-scope ytmusic-description-shelf-renderer">Source&nbsp;: Genius</yt-formatted-string>
					</div>`;
			tabs.lyrics.removeAttribute("disabled");
			tabs.lyrics.removeAttribute("aria-disabled");
		}
	});
};
