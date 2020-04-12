const { loadAdBlockerEngine } = require("./blocker");
module.exports = (win) => loadAdBlockerEngine(win.webContents.session);
