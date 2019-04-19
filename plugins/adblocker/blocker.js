const { initialize, containsAds } = require("./contains-ads");

module.exports.blockWindowAds = webContents => {
	initialize();
	webContents.session.webRequest.onBeforeRequest(
		["*://*./*"],
		(details, cb) => {
			const shouldBeBlocked = containsAds(details.url);
			cb({ cancel: shouldBeBlocked });
		}
	);
};
