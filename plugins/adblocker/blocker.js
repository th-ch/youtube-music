const { containsAds } = require("./contains-ads");

module.exports.blockWindowAds = webContents => {
	webContents.session.webRequest.onBeforeRequest((details, cb) => {
		const shouldBeBlocked = containsAds(details.url);
		cb({ cancel: shouldBeBlocked });
	});
};
