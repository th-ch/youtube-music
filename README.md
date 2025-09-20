<div align="center">

# YTMD

[![GitHub release](https://img.shields.io/github/release/th-ch/youtube-music.svg?style=for-the-badge&logo=youtube-music)](https://github.com/th-ch/youtube-music/releases/)
[![GitHub license](https://img.shields.io/github/license/th-ch/youtube-music.svg?style=for-the-badge)](https://github.com/th-ch/youtube-music/blob/master/license)
[![eslint code style](https://img.shields.io/badge/code_style-eslint-5ed9c7.svg?style=for-the-badge)](https://github.com/th-ch/youtube-music/blob/master/eslint.config.mjs)
[![Build status](https://img.shields.io/github/actions/workflow/status/th-ch/youtube-music/build.yml?branch=master&style=for-the-badge&logo=youtube-music)](https://github.com/th-ch/youtube-music/releases/)
[![GitHub All Releases](https://img.shields.io/github/downloads/th-ch/youtube-music/total?style=for-the-badge&logo=youtube-music)](https://github.com/th-ch/youtube-music/releases/)
[![AUR](https://img.shields.io/aur/version/youtube-music-bin?color=blueviolet&style=for-the-badge&logo=youtube-music)](https://aur.archlinux.org/packages/youtube-music-bin)&nbsp;&nbsp;[![Repo&nbsp;Mapr](https://img.shields.io/badge/Visualise%20Repo-blue?style=for-the-badge)](https://repomapr.com/th-ch/youtube-music)
[![Known Vulnerabilities](https://snyk.io/test/github/th-ch/youtube-music/badge.svg)](https://snyk.io/test/github/th-ch/youtube-music)

</div>

![Screenshot](web/screenshot.png "Screenshot")

- Native look & feel extension, aims at keeping the original interface
  one click

## Content

- [Features](#features)
- [Translation](#translation)
- [Download](#download)
  - [Arch Linux](#arch-linux)
  - [MacOS](#macos)
  - [Windows](#windows)
    - [How to install without a network connection? (in Windows)](#how-to-install-without-a-network-connection-in-windows)
- [Themes](#themes)
- [Dev](#dev)
- [Build your own plugins](#build-your-own-plugins)
  - [Creating a plugin](#creating-a-plugin)
  - [Common use cases](#common-use-cases)
- [Build](#build)
- [Production Preview](#production-preview)
- [Tests](#tests)
- [License](#license)
- [FAQ](#faq)

## Translation

You can help with translation on [Hosted Weblate](https://hosted.weblate.org/projects/youtube-music/).

<a href="https://hosted.weblate.org/engage/youtube-music/">
  <img src="https://hosted.weblate.org/widget/youtube-music/i18n/multi-auto.svg" alt="translation status" />
  <img src="https://hosted.weblate.org/widget/youtube-music/i18n/287x66-black.png" alt="translation status 2" />
</a>

## Download

You can check out the [latest release](https://github.com/th-ch/youtube-music/releases/latest) to quickly find the
latest version.

### Arch Linux

Install the [`youtube-music-bin`](https://aur.archlinux.org/packages/youtube-music-bin) package from the AUR. For AUR installation instructions, take a look at
this [wiki page](https://wiki.archlinux.org/index.php/Arch_User_Repository#Installing_packages).

### macOS

You can install the app using Homebrew (see the [cask definition](https://github.com/th-ch/homebrew-youtube-music)):

```bash
brew install th-ch/youtube-music/youtube-music
```

If you install the app manually and get an error "is damaged and can’t be opened." when launching the app, run the following in the Terminal:

```bash
/usr/bin/xattr -cr /Applications/YouTube\ Music.app
```

### Windows

You can use the [Scoop package manager](https://scoop.sh) to install the `youtube-music` package from
the [`extras` bucket](https://github.com/ScoopInstaller/Extras).

```bash
scoop bucket add extras
scoop install extras/youtube-music
```

Alternately you can use [Winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/), Windows 11s
official CLI package manager to install the `th-ch.YouTubeMusic` package.

*Note: Microsoft Defender SmartScreen might block the installation since it is from an "unknown publisher". This is also
true for the manual installation when trying to run the executable(.exe) after a manual download here on github (same
file).*

```bash
winget install th-ch.YouTubeMusic
```

#### How to install without a network connection? (in Windows)

- Download the `*.nsis.7z` file for _your device architecture_ in [release page](https://github.com/th-ch/youtube-music/releases/latest).
  - `x64` for 64-bit Windows
  - `ia32` for 32-bit Windows
  - `arm64` for ARM64 Windows
- Download installer in release page. (`*-Setup.exe`)
- Place them in the **same directory**.
- Run the installer.

## Themes

You can load CSS files to change the look of the application (Options > Visual Tweaks > Themes).

Some predefined themes are available in https://github.com/kerichdev/themes-for-ytmdesktop-player.

## Dev

```bash
git clone https://github.com/th-ch/youtube-music
cd youtube-music
pnpm install --frozen-lockfile
pnpm dev
```

## Build your own plugins

Using plugins, you can:

- manipulate the app - the `BrowserWindow` from electron is passed to the plugin handler
- change the front by manipulating the HTML/CSS

### Creating a plugin

Create a folder in `src/plugins/YOUR-PLUGIN-NAME`:

- `index.ts`: the main file of the plugin
```typescript
import style from './style.css?inline'; // import style as inline

import { createPlugin } from '@/utils';

export default createPlugin({
  name: 'Plugin Label',
  restartNeeded: true, // if value is true, ytmusic show restart dialog
  config: {
    enabled: false,
  }, // your custom config
  stylesheets: [style], // your custom style,
  menu: async ({ getConfig, setConfig }) => {
    // All *Config methods are wrapped Promise<T>
    const config = await getConfig();
    return [
      {
        label: 'menu',
        submenu: [1, 2, 3].map((value) => ({
          label: `value ${value}`,
          type: 'radio',
          checked: config.value === value,
          click() {
            setConfig({ value });
          },
        })),
      },
    ];
  },
  backend: {
    start({ window, ipc }) {
      window.maximize();

      // you can communicate with renderer plugin
      ipc.handle('some-event', () => {
        return 'hello';
      });
    },
    // it fired when config changed
    onConfigChange(newConfig) { /* ... */ },
    // it fired when plugin disabled
    stop(context) { /* ... */ },
  },
  renderer: {
    async start(context) {
      console.log(await context.ipc.invoke('some-event'));
    },
    // Only renderer available hook
    onPlayerApiReady(api: YoutubePlayer, context: RendererContext) {
      // set plugin config easily
      context.setConfig({ myConfig: api.getVolume() });
    },
    onConfigChange(newConfig) { /* ... */ },
    stop(_context) { /* ... */ },
  },
  preload: {
    async start({ getConfig }) {
      const config = await getConfig();
    },
    onConfigChange(newConfig) {},
    stop(_context) {},
  },
});
```

### Common use cases

- injecting custom CSS: create a `style.css` file in the same folder then:

```typescript
// index.ts
import style from './style.css?inline'; // import style as inline

import { createPlugin } from '@/utils';

export default createPlugin({
  name: 'Plugin Label',
  restartNeeded: true, // if value is true, ytmusic will show a restart dialog
  config: {
    enabled: false,
  }, // your custom config
  stylesheets: [style], // your custom style
  renderer() {} // define renderer hook
});
```

- If you want to change the HTML:

```typescript
import { createPlugin } from '@/utils';

export default createPlugin({
  name: 'Plugin Label',
  restartNeeded: true, // if value is true, ytmusic will show the restart dialog
  config: {
    enabled: false,
  }, // your custom config
  renderer() {
    console.log('hello from renderer');
  } // define renderer hook
});
```

- communicating between the front and back: can be done using the ipcMain module from electron. See `index.ts` file and
  example in `sponsorblock` plugin.

## Build

1. Clone the repo
2. Follow [this guide](https://pnpm.io/installation) to install `pnpm`
3. Run `pnpm install --frozen-lockfile` to install dependencies
4. Run `pnpm build:OS`

- `pnpm dist:win` - Windows
- `pnpm dist:linux` - Linux (amd64)
- `pnpm dist:linux:deb-arm64` - Linux (arm64 for Debian)
- `pnpm dist:linux:rpm-arm64` - Linux (arm64 for Fedora)
- `pnpm dist:mac` - macOS (amd64)
- `pnpm dist:mac:arm64` - macOS (arm64)

Builds the app for macOS, Linux, and Windows,
using [electron-builder](https://github.com/electron-userland/electron-builder).

## Production Preview

```bash
pnpm start
```

## Tests

```bash
pnpm test
```

Uses [Playwright](https://playwright.dev/) to test the app.

## License

MIT © [th-ch](https://github.com/th-ch/youtube-music)

## FAQ

### Why apps menu isn't showing up?

If `Hide Menu` option is on - you can show the menu with the <kbd>alt</kbd> key (or <kbd>\`</kbd> [backtick] if using
the in-app-menu plugin)
