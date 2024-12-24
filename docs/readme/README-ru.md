<div align="center">

# YouTube Music

[![GitHub release](https://img.shields.io/github/release/th-ch/youtube-music.svg?style=for-the-badge&logo=youtube-music)](https://github.com/th-ch/youtube-music/releases/)
[![GitHub license](https://img.shields.io/github/license/th-ch/youtube-music.svg?style=for-the-badge)](https://github.com/th-ch/youtube-music/blob/master/LICENSE)
[![eslint code style](https://img.shields.io/badge/code_style-eslint-5ed9c7.svg?style=for-the-badge)](https://github.com/th-ch/youtube-music/blob/master/.eslintrc.js)
[![Build status](https://img.shields.io/github/actions/workflow/status/th-ch/youtube-music/build.yml?branch=master&style=for-the-badge&logo=youtube-music)](https://GitHub.com/th-ch/youtube-music/releases/)
[![GitHub All Releases](https://img.shields.io/github/downloads/th-ch/youtube-music/total?style=for-the-badge&logo=youtube-music)](https://GitHub.com/th-ch/youtube-music/releases/)
[![AUR](https://img.shields.io/aur/version/youtube-music-bin?color=blueviolet&style=for-the-badge&logo=youtube-music)](https://aur.archlinux.org/packages/youtube-music-bin)
[![Known Vulnerabilities](https://snyk.io/test/github/th-ch/youtube-music/badge.svg)](https://snyk.io/test/github/th-ch/youtube-music)

</div>

![Screenshot](/web/screenshot.png "Screenshot")


<div align="center">
    <a href="https://github.com/th-ch/youtube-music/releases/latest">
        <img src="web/youtube-music.svg" width="400" height="100" alt="YouTube Music SVG">
    </a>
</div>



**Клиент для YouTube Music основанный на Electron с поддержкой:**

- Нативный вид приложения, нацелен на сохранение оригинального интерфейса
- Фреймворк для пользовательских плагинов: изменяйте YouTube Music под ваши нужды (внешний вид, контент, возможности), включайте/выключайте плагины в один клик

## Демо-изображение

|                          Экран плеера (цветовая тема альбома & режим Ambient)                                |
|:---------------------------------------------------------------------------------------------------------:|
|![Screenshot1](https://github.com/th-ch/youtube-music/assets/16558115/53efdf73-b8fa-4d7b-a235-b96b91ea77fc)|

## Содержание

- [Возможности](#features)
- [Доступные плагины](#available-plugins)
- [Перевод](#translation)
- [Скачать](#download)
  - [Arch Linux](#arch-linux)
  - [MacOS](#macos)
  - [Windows](#windows)
    - [Как установить без подключения к интернету? (в Windows)](#how-to-install-without-a-network-connection-in-windows)
- [Темы](#themes)
- [Для разработчиков](#dev)
- [Создайте свои собственные плагины](#build-your-own-plugins)
  - [Создание плагина](#creating-a-plugin)
  - [Примеры использования](#common-use-cases)
- [Сборка](#build)
- [Предварительный просмотр](#production-preview)
- [Тестирование](#tests)
- [Лицензия](#license)
- [Часто задаваемые вопросы](#faq)

## Возможности:

- **Авто-подтверждение при паузе** (Всегда включено): отключает всплывающие уведомление ["Продолжить просмотр?"](https://user-images.githubusercontent.com/61631665/129977894-01c60740-7ec6-4bf0-9a2c-25da24491b0e.png),
    которое  приостанавливает воспроизведение через определённое время

 - И больше ...

## Доступные плагины:

- **Блокировщик рекламы**: Блокирует всю рекламу и трекеры

- **Действия с альбомом**: Добавляет кнопки "Убрать дизлайк", "Дизлайк", "Лайк", "Убрать лайк" и применяет их действия ко всем трекам в плейлисте или альбоме

- **Цветовая тема альбома**: Применяет динамическую тему и эффекты, основываясь на цветовой палитре альбома

- **Режим Ambient**: Применяет световой эффект, проецируя нежные цвета из видео на задний фон вашего экрана

- **Нормализация аудио**: Применяет нормализацию к аудио (уменьшает громкость громких частей трека и повышает громкость тихих частей трека)

- **Размытие панели навигации**: Делает панель навигации прозрачной и размытой

- **Обход возрастных ограничений**: Обходит проверку возраста YouTube

- **Выбор субтитров**: Включить субтитры

- **Компактная боковая панель**: Всегда показывать боковую панель компактно

- **Плавный переход**: Плавный переход между треками

- **Отключить автопроигрыш**: Каждый трек начинается в режиме паузы

- **[Discord](https://discord.com/) Rich Presence**: Показывает вашим друзьям, что вы слушаете с помощью [Rich Presence](https://user-images.githubusercontent.com/28219076/104362104-a7a0b980-5513-11eb-9744-bb89eabe0016.png)

- **Загрузчик**: Загрузка MP3 [напрямую из интерфейса](https://user-images.githubusercontent.com/61631665/129977677-83a7d067-c192-45e1-98ae-b5a4927393be.png) [(youtube-dl)](https://github.com/ytdl-org/youtube-dl)

- **Расширенная громкость**: Делает слайдер громкости [расширенным](https://greasyfork.org/en/scripts/397686-youtube-music-fix-volume-ratio/) облегчая выбор громкости

- **Меню в приложении**: [Придаёт панели меню красивый тёмный вид](https://user-images.githubusercontent.com/78568641/112215894-923dbf00-8c29-11eb-95c3-3ce15db27eca.png)

  > (посмотрите [этот пост,](https://github.com/th-ch/youtube-music/issues/410#issuecomment-952060709) если у вас есть проблемы с доступом к меню после включения этого плагина и опции "Скрыть меню")

- **Скробблер**: Добавляет поддержку скробблинга [Last.fm](https://www.last.fm/) и [ListenBrainz](https://listenbrainz.org/)

- **Lumia Stream**: Добавляет поддержку [Lumia Stream](https://lumiastream.com/)

- **Тесты песен Genius**: Добавляет поддержку текстов для большинства песен

- **Music Together**: Делитесь плейлистом с другими. Когда ведущий воспроизводит трек, все остальные будут слушать этот же трек.

- **Навигация**: Кнопки Назад/Вперед интегрированы в интерфейс, как в вашем любимом браузере

- **Без входа в систему Google**: Убирает из интерфейса кнопки и ссылки для входа через Google

- **Уведомления**: Показывает уведомление, когда трек начинает играть ([интерактивные уведомления](https://user-images.githubusercontent.com/78568641/114102651-63ce0e00-98d0-11eb-9dfe-c5a02bb54f9c.png) доступны только для Windows)

- **Картинка в картинке**: Позволяет переключить приложение в режим "картинка в картинке"

- **Скорость воспроизведения**: Слушайте быстрее, слушайте медленнее! [Добавляет слайдер для контроля скорости трека](https://user-images.githubusercontent.com/61631665/129976003-e55db5ba-bf42-448c-a059-26a009775e68.png)

- **Точная громкость**: Точечно управляйте громкостью с помощью колеса мыши/горячих клавиш, с кастомным интерфейсом и настраиваемыми шагами громкости

- **Ярлыки (и MPRIS)**: Позволяет настроить глобальные горячие клавиши управления воспроизведением (плей/пауза/следующий/предыдущий) + отключает [отображение медиа на экране,](https://user-images.githubusercontent.com/84923831/128601225-afa38c1f-dea8-4209-9f72-0f84c1dd8b54.png) переопределяя клавиши управления + включает Ctrl/CMD + F для поиска + включает поддержку linux mpris для клавиш управления медиа + [настраиваемые сочетания клавиш](https://github.com/Araxeus/youtube-music/blob/1e591d6a3df98449bcda6e63baab249b28026148/providers/song-controls.js#L13-L50) для [продвинутых пользователей](https://github.com/th-ch/youtube-music/issues/106#issuecomment-952156902)

- **Пропускать непонравившиеся треки**: Пропускает непонравившиеся треки

- **Пропуск тишины**: Автоматически пропускает тихие моменты в песнях

- [**SponsorBlock**](https://github.com/ajayyy/SponsorBlock): Автоматически пропускает немузыкальные части, такие как интро/аутро музыкальных видео, где трек не играет

- **Управление воспроизведением из панели задач**: Управляйте воспроизведением из [панели задач Windows](https://user-images.githubusercontent.com/78568641/111916130-24a35e80-8a82-11eb-80c8-5021c1aa27f4.png)

- **TouchBar**: Кастомная раскладка TouchBar для MacOS

- **Tuna OBS**: Интеграция с [OBS](https://obsproject.com/) плагином [Tuna](https://obsproject.com/forum/resources/tuna.843/)

- **Изменение качества видео**: Позволяет менять качество видео [кнопкой](https://user-images.githubusercontent.com/78568641/138574366-70324a5e-2d64-4f6a-acdd-dc2a2b9cecc5.png) на медиаплеере видео

- **Переключатель видео**: Добавляет
  [кнопку](https://user-images.githubusercontent.com/28893833/173663950-63e6610e-a532-49b7-9afa-54cb57ddfc15.png) переключения режимов Трек/Видео. Также может удалять вкладку "Видео" полностью

- **Визуализатор**: Различные визуализаторы музыки

- **Synced Lyrics**:
Предоставляет синхронизированные слова для песен из таких источников, как [LRClib](https://lrclib.net).

## Перевод

Вы можете помочь с переводом на ваш язык на [Hosted Weblate](https://hosted.weblate.org/projects/youtube-music/).

<a href="https://hosted.weblate.org/engage/youtube-music/">
  <img src="https://hosted.weblate.org/widget/youtube-music/i18n/multi-auto.svg" alt="translation status" />
  <img src="https://hosted.weblate.org/widget/youtube-music/i18n/287x66-black.png" alt="translation status 2" />
</a>

## Скачать

Вы можете посмотреть [latest release,](https://github.com/th-ch/youtube-music/releases/latest) чтобы быстро найти новую версию.

### Arch Linux

Установите пакет [`youtube-music-bin`](https://aur.archlinux.org/packages/youtube-music-bin) из AUR. Инструкции по установке из AUR можете найти на этой [вики-странице](https://wiki.archlinux.org/index.php/Arch_User_Repository#Installing_packages).

### macOS

Вы можете установить приложение с помощью Homebrew (сморите [cask definition](https://github.com/th-ch/homebrew-youtube-music)):

```bash
brew install th-ch/youtube-music/youtube-music
```

Если вы устанавливаете приложение вручную и получаете ошибку "is damaged and can’t be opened.", запустите в терминале следующую команду:

```bash
/usr/bin/xattr -cr /Applications/YouTube\ Music.app
```

### Windows

Вы можете использовать [пакетный менеджер Scoop](https://scoop.sh) для установки пакета `youtube-music` из [`extras` bucket](https://github.com/ScoopInstaller/Extras).

```bash
scoop bucket add extras
scoop install extras/youtube-music
```

Также для установки вы можете использовать [Winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/), официальный пакетный менеджер командной строки Windows 11, для установки пакета `th-ch.YouTubeMusic`.

*К сведению: SmartScreen защитника Windows может блокировать установку, так как она от "неизвестного издателя". Это также применимо к методу ручной установки, когда вы пытаетесь запустить исполняемый файл(.exe) после загрузки здесь, на GitHub (тот же файл).*

```bash
winget install th-ch.YouTubeMusic
```

#### Установка без подключения к Интернету? (в Windows)

- Скачайте файл `*.nsis.7z` из _архетиктура вашего устройства_ на [release page](https://github.com/th-ch/youtube-music/releases/latest).
  - `x64` для 64-bit Windows
  - `ia32` для 32-bit Windows
  - `arm64` для ARM64 Windows
- Скачайте установщик в release page. (`*-Setup.exe`)
- Поместите их в **одной директории**.
- Запустите установщик.

## Темы

Вы можете загрузить файл CSS для смены внешнего вида приложения (Настройки > Визуальные настройки > Тема).

Некоторые предустановленные темы доступны здесь: https://github.com/kerichdev/themes-for-ytmdesktop-player.

## Для разработчиков

```bash
git clone https://github.com/th-ch/youtube-music
cd youtube-music
pnpm install --frozen-lockfile
pnpm dev
```

## Создайте свои собственные плагины

Используя плагины вы можете:

- Манипулировать приложением - `BrowserWindow` из electron проброшен обработчику плагинов
- Изменять внешний вид, манипулируя HTML/CSS

### Создание плагина

Создайте директорию в `src/plugins/YOUR-PLUGIN-NAME`:

- `index.ts`: основной файл плагина
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

### Примеры использования

- Кастомный CSS: создайте файл `style.css` в той же директории, затем:

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

- Если вы хотите изменить HTML:

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

- обмен между фронтом и бэком может быть выполнен с помощью модуля ipcMain из electron. Смотрите файл `index.ts` и
  пример в плагине `sponsorblock`.

## Сборка

1. Склонируйте репозиторий
2. Следуйте [этой инструкции,](https://pnpm.io/installation) чтобы установить `pnpm`
3. Запустите `pnpm install --frozen-lockfile` для установки зависимостей
4. Запустите `pnpm build:OS`

- `pnpm dist:win` - Windows
- `pnpm dist:linux` - Linux (amd64)
- `pnpm dist:linux:deb-arm64` - Linux (arm64 for Debian)
- `pnpm dist:linux:rpm-arm64` - Linux (arm64 for Fedora)
- `pnpm dist:mac` - macOS (amd64)
- `pnpm dist:mac:arm64` - macOS (arm64)

Сборка приложения для macOS, Linux, и Windows,
используя [electron-builder](https://github.com/electron-userland/electron-builder).

## Предварительный просмотр

```bash
pnpm start
```

## Тестирование

```bash
pnpm test
```

Использует [Playwright](https://playwright.dev/) для тестирования приложения.

## Лицензия

MIT © [th-ch](https://github.com/th-ch/youtube-music)

## Часто задаваемые вопросы

### Почему меня приложения не отображается?

Если опция `Скрыть меню` включена - вы можете отобразить меню с помощью клавиши <kbd>alt</kbd> (или <kbd>\`</kbd> [обратный апостроф], если используете плагин "Меню в приложении")
