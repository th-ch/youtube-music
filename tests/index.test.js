describe("YouTube Music App", () => {
	const app = global.__APP__;

	test("With default settings, app is launched and visible", async () => {
		expect(app.isRunning()).toBe(true);

		const win = app.browserWindow;

		const isVisible = await win.isVisible();
		expect(isVisible).toBe(true);

		const { width, height } = await win.getBounds();
		expect(width).toBeGreaterThan(0);
		expect(height).toBeGreaterThan(0);

		const { client } = app;
		const title = await client.getTitle();
		expect(title).toEqual("YouTube Music");
	});
});
