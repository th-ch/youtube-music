const fs = require("fs");
const path = require("path");

const { ipcMain, ipcRenderer } = require("electron");

// Creates a DOM element from a HTML string
module.exports.ElementFromHtml = (html) => {
	var template = document.createElement("template");
	html = html.trim(); // Never return a text node of whitespace as the result
	template.innerHTML = html;
	return template.content.firstChild;
};

// Creates a DOM element from a HTML file
module.exports.ElementFromFile = (filepath) => {
	return module.exports.ElementFromHtml(fs.readFileSync(filepath, "utf8"));
};

module.exports.templatePath = (pluginPath, name) => {
	return path.join(pluginPath, "templates", name);
};

module.exports.triggerAction = (channel, action, ...args) => {
	return ipcRenderer.send(channel, action, ...args);
};

module.exports.triggerActionSync = (channel, action, ...args) => {
	return ipcRenderer.sendSync(channel, action, ...args);
};

module.exports.listenAction = (channel, callback) => {
	return ipcMain.on(channel, callback);
};

module.exports.fileExists = (path, callbackIfExists) => {
	fs.access(path, fs.F_OK, (err) => {
		if (err) {
			return;
		}

		callbackIfExists();
	});
};

const cssToInject = new Map();
module.exports.injectCSS = (webContents, filepath, cb = undefined) => {
	if (!cssToInject.size) setupCssInjection(webContents);

	cssToInject.set(filepath, cb);
};

const setupCssInjection = (webContents) => {
	webContents.on("did-finish-load", () => {
		cssToInject.forEach(async (cb, filepath) => {
			await webContents.insertCSS(fs.readFileSync(filepath, "utf8"));
			cb?.();
		})
	});
}

module.exports.getAllPlugins = () => {
	const isDirectory = (source) => fs.lstatSync(source).isDirectory();
	return fs
		.readdirSync(__dirname)
		.map((name) => path.join(__dirname, name))
		.filter(isDirectory)
		.map((name) => path.basename(name));
};
