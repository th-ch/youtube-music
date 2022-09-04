const path = require("path");

const { _electron: electron } = require("playwright");
const { test, expect } = require("@playwright/test");

process.env.NODE_ENV = "test";

const appPath = path.resolve(__dirname, "..");

test("YouTube Music App - With default settings, app is launched and visible", async () => {
	const app = await electron.launch({
		args: [
			"--no-sandbox",
			"--disable-gpu",
			"--whitelisted-ips=",
			"--disable-dev-shm-usage",
			appPath,
		],
	});

	const window = await app.firstWindow();
	const title = await window.title();
	expect(title).toEqual("YouTube Music");

	const url = window.url();
	expect(url.startsWith("https://music.youtube.com")).toBe(true);

	await app.close();
});
