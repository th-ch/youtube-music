const { blockWindowAds } = require("./blocker");

module.exports = win => blockWindowAds(win.webContents);
