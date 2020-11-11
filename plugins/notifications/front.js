let videoElement = null;
let image = null;

const observer = new MutationObserver((mutations, observer) => {
	if (!videoElement) {
		videoElement = document.querySelector("video");
	}

	if (!image) {
		image = document.querySelector(".ytmusic-player-bar.image");
	}

	if (videoElement !== null && image !== null) {
		observer.disconnect();
		let notificationImage = null;

		videoElement.addEventListener("play", () => {
			notify({
				title: getTitle(),
				artist: getArtist(),
				image: notificationImage,
			});
		});

		image.addEventListener("load", () => {
			notificationImage = null;
			const imageInBase64 = convertImageToBase64(image);
			if (image && image.complete && image.naturalHeight !== 0) {
				notificationImage = imageInBase64;
			}
		});
	}
});

// Convert an image (DOM element) to base64 string
const convertImageToBase64 = (image, size = 256) => {
	image.setAttribute("crossorigin", "anonymous");

	const c = document.createElement("canvas");
	c.height = size;
	c.width = size;

	const ctx = c.getContext("2d");
	ctx.drawImage(
		image,
		0,
		0,
		image.naturalWidth,
		image.naturalHeight,
		0,
		0,
		c.width,
		c.height
	);

	const imageInBase64 = c.toDataURL();
	return imageInBase64;
};

const getTitle = () => {
	const title = document.querySelector(".title.ytmusic-player-bar").textContent;
	return title;
};

const getArtist = () => {
	const bar = document.querySelectorAll(".subtitle.ytmusic-player-bar")[0];
	let artist;

	if (bar.querySelectorAll(".yt-simple-endpoint.yt-formatted-string")[0]) {
		artist = bar.querySelectorAll(".yt-simple-endpoint.yt-formatted-string")[0]
			.textContent;
	} else if (bar.querySelectorAll(".byline.ytmusic-player-bar")[0]) {
		artist = bar.querySelectorAll(".byline.ytmusic-player-bar")[0].textContent;
	}

	return artist;
};

const observeVideoAndThumbnail = () => {
	observer.observe(document, {
		childList: true,
		subtree: true,
	});
};

module.exports = observeVideoAndThumbnail;
