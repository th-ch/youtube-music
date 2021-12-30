/**
 * @jest-environment ./tests/environment
 */

describe("YouTube Music App", () => {
	const app = global.__APP__;

	test("With default settings, app is launched and visible", async () => {
		const window = await app.firstWindow();
		const title = await window.title();
		expect(title).toEqual("YouTube Music");

		const url = window.url();
		expect(url.startsWith("https://music.youtube.com")).toBe(true);
	});
});
