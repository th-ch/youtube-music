const { ipcMain } = require('electron');

const express = require('express');

const app = express();
const port = process.env.YM_API_PORT || 8120;
const uuid = require('uuid');

const getResponseForUUID = async (uuid) => {
	var locked = true;
	var data;
	console.log(`locking ${uuid}`);
	ipcMain.on('response-uuid', async (_, eventUUID, eventData) => {
		if (eventUUID == uuid) {
			locked = false;
			console.log(`${uuid} unlocked`);
			data = eventData;
		}
	});
	while (locked) {
		const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
		await delay(100);
		continue;
	}
	return data;
};

module.exports = async (win) => {
	app.get('/player', async (req, res) => {
		const task_lock_uuid = uuid.v4();
		win.webContents.send('get-player-queue', task_lock_uuid);
		resp = await getResponseForUUID(task_lock_uuid);
		res.send(resp);
	});

	app.listen(port, () => {
		console.log(`API listening on port ${port}
    to change set YM_API_PORT env example: export YM_API_PORT=2000`);
	});
};
