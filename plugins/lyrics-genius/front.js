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
		if (!tabs.lyrics?.hasAttribute("disabled")) {
			return;
		}

		let hasLyrics = true;

		const html = ipcRenderer.sendSync(
			"search-genius-lyrics",
			extractedSongInfo
		);
		if (!html) {
			// Delete previous lyrics if tab is open and couldn't get new lyrics
			checkLyricsContainer(() => {
				hasLyrics = false;
				setTabsOnclick(undefined);
			});
			return;
		}

		if (is.dev()) {
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

		enableLyricsTab();

		setTabsOnclick(enableLyricsTab);

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

		function setLyrics(lyricsContainer) {
			lyricsContainer.innerHTML = `<div id="contents" class="style-scope ytmusic-section-list-renderer description ytmusic-description-shelf-renderer genius-lyrics">
			 			${hasLyrics ? lyrics : 'Subtitles could not be retrieved'}

			 			<yt-formatted-string class="footer style-scope ytmusic-description-shelf-renderer" style="text-align: initial"></yt-formatted-string>
					</div>`;
			if (hasLyrics) {
				lyricsContainer.querySelector('.footer').textContent = 'Source: Genius';
				enableLyricsTab();
			}
		}

		function setTabsOnclick(callback) {
			for (tab of [tabs.upNext, tabs.discover]) {
				if (tab) {
					tab.onclick = callback;
				}
			}
		}

		function enableLyricsTab() {
			tabs.lyrics.removeAttribute("disabled");
			tabs.lyrics.removeAttribute("aria-disabled");
		}
	});
};
