// Define global chrome object to be compliant with the extension code
global.chrome = {
	runtime: {
		getManifest: () => ({
			version: 1
		})
	}
};

module.exports = () => {
	require("YoutubeNonStop/autoconfirm.js");
};
