const clickInYoutubeMusic = (win, selector) => {
	win.webContents.executeJavaScript(
		`document.querySelector("${selector}").click();`,
		true
	);
};

module.exports = { clickInYoutubeMusic };
