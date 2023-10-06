const path = require('node:path');

const { _electron: electron } = require('playwright');
const { test, expect } = require('@playwright/test');
const { is } = require('electron-is');

process.env.NODE_ENV = 'test';

const appPath = path.resolve(__dirname, '..');

test('YouTube Music App - With default settings, app is launched and visible', async () => {
  const app = await electron.launch({
    cwd: appPath,
    args: [
      appPath,
      '--no-sandbox',
      '--disable-gpu',
      '--whitelisted-ips=',
      '--disable-dev-shm-usage',
    ],
  });

  const window = await app.firstWindow();

  const consentForm = await window.$(
    "form[action='https://consent.youtube.com/save']",
  );
  if (consentForm) {
    await consentForm.click('button');
  }

  const title = await window.title();
  if (!is.linux()) {
    expect(title.replaceAll(/\s/g, ' ')).toEqual('YouTube Music');
  }

  const url = window.url();
  expect(url.startsWith('https://music.youtube.com')).toBe(true);

  await app.close();
});
