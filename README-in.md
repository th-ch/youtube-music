<div align="center">

# YouTube Music

[![GitHub release](https://img.shields.io/github/release/th-ch/youtube-music.svg?style=for-the-badge&logo=youtube-music)](https://github.com/th-ch/youtube-music/releases/)
[![GitHub license](https://img.shields.io/github/license/th-ch/youtube-music.svg?style=for-the-badge)](https://github.com/th-ch/youtube-music/blob/master/license)
[![eslint code style](https://img.shields.io/badge/code_style-eslint-5ed9c7.svg?style=for-the-badge)](https://github.com/th-ch/youtube-music/blob/master/eslint.config.mjs)
[![Build status](https://img.shields.io/github/actions/workflow/status/th-ch/youtube-music/build.yml?branch=master&style=for-the-badge&logo=youtube-music)](https://GitHub.com/th-ch/youtube-music/releases/)
[![GitHub All Releases](https://img.shields.io/github/downloads/th-ch/youtube-music/total?style=for-the-badge&logo=youtube-music)](https://GitHub.com/th-ch/youtube-music/releases/)
[![AUR](https://img.shields.io/aur/version/youtube-music-bin?color=blueviolet&style=for-the-badge&logo=youtube-music)](https://aur.archlinux.org/packages/youtube-music-bin)
[![Known Vulnerabilities](https://snyk.io/test/github/th-ch/youtube-music/badge.svg)](https://snyk.io/test/github/th-ch/youtube-music)

</div>

![Screenshot](web/screenshot.png "Screenshot")


<div align="center">
	<a href="https://github.com/th-ch/youtube-music/releases/latest">
		<img src="web/youtube-music.svg" width="400" height="100" alt="YouTube Music SVG">
	</a>
</div>

Baca ini dalam bahasa lain : [🇰🇷](./docs/readme/README-ko.md), [🇫🇷](./docs/readme/README-fr.md), [🇮🇸](./docs/readme/README-is.md), [🇨🇱 🇪🇸](./docs/readme/README-es.md), [🇷🇺](./docs/readme/README-ru.md), [🇺🇦](./docs/readme/README-uk.md), [🇭🇺](./docs/readme/README-hu.md), [🇧🇷](./docs/readme/README-pt.md), [🇯🇵](./docs/readme/README-ja.md)

**Pembungkus Electron untuk YouTube Music dengan fitur:**

- Tampilan dan nuansa asli, bertujuan mempertahankan antarmuka asli
- Framework untuk plugin kustom: ubah YouTube Music sesuai kebutuhan Anda (gaya, konten, fitur), aktifkan/nonaktifkan plugin dalam satu klik

## Gambar Demo

|                          Layar Pemutar (tema warna album & cahaya ambient)                                |
|:---------------------------------------------------------------------------------------------------------:|
|![Screenshot1](https://github.com/th-ch/youtube-music/assets/16558115/53efdf73-b8fa-4d7b-a235-b96b91ea77fc)|

## Konten

- [Fitur](#features)
- [Plugin yang Tersedia](#available-plugins)
- [Terjemahan](#translation)
- [Unduh](#download)
  - [Arch Linux](#arch-linux)
  - [MacOS](#macos)
  - [Windows](#windows)
    - [Cara install tanpa koneksi internet? (di Windows)](#how-to-install-without-a-network-connection-in-windows)
- [Tema](#themes)
- [Pengembangan](#dev)
- [Buat Plugin Sendiri](#build-your-own-plugins)
  - [Membuat Plugin](#creating-a-plugin)
  - [Kasus Penggunaan Umum](#common-use-cases)
- [Build](#build)
- [Preview Produksi](#production-preview)
- [Tests](#tests)
- [Lisensi](#license)
- [FAQ](#faq)

## Fitur:

- **Konfirmasi otomatis saat dijeda** (Selalu Aktif): menonaktifkan popup ["Continue Watching?"](https://user-images.githubusercontent.com/61631665/129977894-01c60740-7ec6-4bf0-9a2c-25da24491b0e.png)
  yang menjeda musik setelah waktu tertentu

 - Dan banyak lagi ...

## Plugin yang Tersedia:

- **Ad Blocker**: Blokir semua iklan dan pelacakan secara default

- **Album Actions**: Menambahkan tombol Batal Tidak Suka, Tidak Suka, Suka, dan Batal Suka untuk diterapkan pada semua lagu dalam playlist atau album

- **Album Color Theme**: Menerapkan tema dinamis dan efek visual berdasarkan palet warna album

- **Ambient Mode**: Menerapkan efek pencahayaan dengan memantulkan warna lembut dari video ke latar belakang layar Anda

- **Audio Compressor**: Menerapkan kompresi pada audio (menurunkan volume bagian terhalus dari sinyal dan menaikkan volume bagian terlirih)

- **Blur Navigation Bar**: membuat bilah navigasi transparan dan buram

- **Bypass Age Restrictions**: melewati verifikasi usia YouTube

- **Captions Selector**: Mengaktifkan subtitle

- **Compact Sidebar**: Selalu mengatur sidebar dalam mode kompak

- **Crossfade**: Crossfade antar lagu

- **Disable Autoplay**: Membuat setiap lagu dimulai dalam mode "dijeda"

- **[Discord](https://discord.com/) Rich Presence**: Tunjukkan kepada teman Anda apa yang Anda dengarkan dengan [Rich Presence](https://user-images.githubusercontent.com/28219076/104362104-a7a0b980-5513-11eb-9744-bb89eabe0016.png)

- **Downloader**: mengunduh MP3 [langsung dari antarmuka](https://user-images.githubusercontent.com/61631665/129977677-83a7d067-c192-45e1-98ae-b5a4927393be.png) [(youtube-dl)](https://github.com/ytdl-org/youtube-dl)

- **Equalizer**: menambahkan filter untuk meningkatkan atau memotong rentang frekuensi tertentu (misalnya bass booster)

- **Exponential Volume**: Membuat slider volume [eksponensial](https://greasyfork.org/en/scripts/397686-youtube-music-fix-volume-ratio/) sehingga lebih mudah untuk memilih volume yang lebih rendah

- **In-App Menu**: [memberikan bar tampilan yang mewah dan gelap](https://user-images.githubusercontent.com/78568641/112215894-923dbf00-8c29-11eb-95c3-3ce15db27eca.png)

  > (lihat [postingan ini](https://github.com/th-ch/youtube-music/issues/410#issuecomment-952060709) jika Anda memiliki masalah mengakses menu setelah mengaktifkan plugin ini dan opsi hide-menu)

- **Scrobbler**: Menambahkan dukungan scrobbling untuk [Last.fm](https://www.last.fm/) dan [ListenBrainz](https://listenbrainz.org/)

- **Lumia Stream**: Menambahkan dukungan [Lumia Stream](https://lumiastream.com/) 

- **Lyrics Genius**: Menambahkan dukungan lirik untuk sebagian besar lagu

- **Music Together**: Bagikan playlist dengan orang lain. Ketika host memutar lagu, semua orang akan mendengar lagu yang sama

- **Navigation**: Panah navigasi Berikutnya/Kembali terintegrasi langsung di antarmuka, seperti di browser favorit Anda

- **No Google Login**: Menghapus tombol dan tautan login Google dari antarmuka

- **Notifications**: Menampilkan notifikasi ketika lagu mulai diputar ([notifikasi interaktif](https://user-images.githubusercontent.com/78568641/114102651-63ce0e00-98d0-11eb-9dfe-c5a02bb54f9c.png)
  tersedia di Windows)

- **Picture-in-picture**: memungkinkan untuk beralih aplikasi ke mode picture-in-picture

- **Playback Speed**:  Dengar cepat, dengar lambat! [ Menambahkan slider yang mengontrol kecepatan lagu](https://user-images.githubusercontent.com/61631665/129976003-e55db5ba-bf42-448c-a059-26a009775e68.png)

- **Precise Volume**: Mengontrol volume dengan presisi menggunakan roda mouse/hotkey, dengan HUD kustom dan langkah volume yang dapat disesuaikan

- **Shortcuts (& MPRIS)**: Memungkinkan pengaturan hotkey global untuk pemutaran (putar/jeda/berikutnya/sebelumnya) + menonaktifkan [media osd](https://user-images.githubusercontent.com/84923831/128601225-afa38c1f-dea8-4209-9f72-0f84c1dd8b54.png)
  dengan menimpa tombol media + mengaktifkan Ctrl/CMD + F untuk pencarian + mengaktifkan dukungan mpris linux untuk tombol media + [hotkey kustom](https://github.com/Araxeus/youtube-music/blob/1e591d6a3df98449bcda6e63baab249b28026148/providers/song-controls.js#L13-L50)
  untuk [penggunaan lanjutan](https://github.com/th-ch/youtube-music/issues/106#issuecomment-952156902)

- **Skip Disliked Song**: Melewati lagu yang tidak disukai

- **Skip Silences**: Otomatis melewati bagian yang sunyi

- [**SponsorBlock**](https://github.com/ajayyy/SponsorBlock): Otomatis melewati bagian non-musik seperti intro/outro atau bagian video musik di mana lagu tidak dimainkan

- **Synced Lyrics**: Menyediakan lirik tersinkronisasi untuk lagu, menggunakan penyedia seperti [LRClib](https://lrclib.net).

- **Taskbar Media Control**: Kontrol pemutaran dari
  [taskbar Windows](https://user-images.githubusercontent.com/78568641/111916130-24a35e80-8a82-11eb-80c8-5021c1aa27f4.png) anda.

- **TouchBar**:  Layout TouchBar kustom untuk macOS

- **Tuna OBS**: Integrasi dengan plugin [Tuna](https://obsproject.com/forum/resources/tuna.843/) dari [OBS](https://obsproject.com/)

- **Video Quality Changer**: Memungkinkan mengubah kualitas video dengan [tombol](https://user-images.githubusercontent.com/78568641/138574366-70324a5e-2d64-4f6a-acdd-dc2a2b9cecc5.png) di overlay video
  
- **Video Toggle**: Menambahkan
  [tombol](https://user-images.githubusercontent.com/28893833/173663950-63e6610e-a532-49b7-9afa-54cb57ddfc15.png) untuk beralih antara mode Video/Lagu. juga dapat secara opsional menghapus seluruh tab video

- **Visualizer**: Berbagai visualizer musik


## Terjemahan

Anda dapat membantu dengan terjemahan di [Hosted Weblate](https://hosted.weblate.org/projects/youtube-music/).

<a href="https://hosted.weblate.org/engage/youtube-music/">
  <img src="https://hosted.weblate.org/widget/youtube-music/i18n/multi-auto.svg" alt="translation status" />
  <img src="https://hosted.weblate.org/widget/youtube-music/i18n/287x66-black.png" alt="translation status 2" />
</a>

## Unduh

Anda dapat melihat [rilis terbaru](https://github.com/th-ch/youtube-music/releases/latest) untuk dengan cepat menemukan versi terbaru.

### Arch Linux

Install paket [`youtube-music-bin`](https://aur.archlinux.org/packages/youtube-music-bin) dari AUR. Untuk instruksi instalasi AUR, lihat [halaman wiki](https://wiki.archlinux.org/index.php/Arch_User_Repository#Installing_packages).

### macOS

Anda dapat menginstal aplikasi menggunakan Homebrew (lihat [definisi cask](https://github.com/th-ch/homebrew-youtube-music)):

```bash
brew install th-ch/youtube-music/youtube-music
```

Jika Anda menginstal aplikasi secara manual dan mendapat error "rusak dan tidak dapat dibuka." saat meluncurkan aplikasi, jalankan perintah berikut di Terminal:

```bash
/usr/bin/xattr -cr /Applications/YouTube\ Music.app
```

### Windows

Anda dapat menggunakan [Scoop package manager](https://scoop.sh) untuk menginstal paket `youtube-music` dari [`extras` bucket](https://github.com/ScoopInstaller/Extras).

```bash
scoop bucket add extras
scoop install extras/youtube-music
```

Alternatifnya Anda dapat menggunakan [Winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/), manajer paket CLI resmi Windows 11 untuk menginstal paket `th-ch.YouTubeMusic` .

*Catatan: Microsoft Defender SmartScreen mungkin memblokir instalasi karena berasal dari "penerbit tidak dikenal". Ini juga berlaku untuk instalasi manual saat mencoba menjalankan executable (.exe) setelah unduhan manual di sini di github (file yang sama).*

```bash
winget install th-ch.YouTubeMusic
```

#### Cara install tanpa koneksi internet? (di Windows)

- Unduh file `*.nsis.7z` untuk arsitektur perangkat Anda di [halaman rilis](https://github.com/th-ch/youtube-music/releases/latest).
  - `x64` untuk Windows 64-bit
  - `ia32` untuk Windows 32-bit
  - `arm64` untuk Windows ARM64
- Unduh installer di halaman rilis. (`*-Setup.exe`)
- Tempatkan mereka di **direktori yang sama**.
- Jalankan installer.

## Tema

Anda dapat memuat file CSS untuk mengubah tampilan aplikasi (Opsi > Visual Tweaks > Tema).

Beberapa tema yang sudah ditentukan tersedia di https://github.com/kerichdev/themes-for-ytmdesktop-player.

## Pengembangan

```bash
git clone https://github.com/th-ch/youtube-music
cd youtube-music
pnpm install --frozen-lockfile
pnpm dev
```

## Buat Plugin Sendiri

Menggunakan plugin, Anda dapat:

- memanipulasi aplikasi - `BrowserWindow` dari electron diteruskan ke handler plugin
- mengubah tampilan depan dengan memanipulasi HTML/CSS

### Membuat Plugin

Buat folder di `src/plugins/YOUR-PLUGIN-NAME`:

- `index.ts`: file utama plugin
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

### Kasus Penggunaan Umum

- menyuntikkan CSS kustom: buat file `style.css` di folder yang sama kemudian:

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

- Jika Anda ingin mengubah HTML:

```typescript
import { createPlugin } from '@/utils';

export default createPlugin({
  name: 'Plugin Label',
  restartNeeded: true, // if value is true, ytmusic will show the restart dialog
  config: {
    enabled: false,
  }, // your custom config
  renderer() {
    // Remove the login button
    document.querySelector(".sign-in-link.ytmusic-nav-bar").remove();
  } // define renderer hook
});
```

- komunikasi antara depan dan belakang: dapat dilakukan menggunakan modul ipcMain dari electron. Lihat file `index.ts` dan contoh di plugin `sponsorblock`.

## Build

1. Clone repo
2. Ikuti [panduan ini](https://pnpm.io/installation) untuk menginstal `pnpm`
3. Jalankan `pnpm install --frozen-lockfile` untuk menginstal dependensi
4. Jalankan `pnpm build:OS`

- `pnpm dist:win` - Windows
- `pnpm dist:linux` - Linux (amd64)
- `pnpm dist:linux:deb-arm64` - Linux (arm64 untuk Debian)
- `pnpm dist:linux:rpm-arm64` - Linux (arm64 untuk Fedora)
- `pnpm dist:mac` - macOS (amd64)
- `pnpm dist:mac:arm64` - macOS (arm64)

Membangun aplikasi untuk macOS, Linux, dan Windows, menggunakan [electron-builder](https://github.com/electron-userland/electron-builder).

## Preview Produksi

```bash
pnpm start
```

## Tests

```bash
pnpm test
```

Menggunakan [Playwright](https://playwright.dev/) untuk menguji aplikasi.

## Lisensi

MIT © [th-ch](https://github.com/th-ch/youtube-music)

## FAQ

### Mengapa menu aplikasi tidak muncul?

Jika opsi `Hide Menu` aktif - Anda dapat menunjukkan menu dengan tombol <kbd>alt</kbd> key (or <kbd>\`</kbd> [backtick] jika menggunakan plugin in-app-menu)
