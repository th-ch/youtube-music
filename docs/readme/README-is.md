<div align="center">

# YouTube Tónlist

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
		<img src="../../web/youtube-music.svg" width="400" height="100" alt="YouTube Music SVG">
	</a>
</div>

**Electron umbúðir utan um YouTube Tónlist sem inniheldur:**

- Innfæddur útlit og tilfinning, miðar að því að halda upprunalegu viðmótinu
- Rammi fyrir sérsniðnar tengiforrit: breyttu YouTube Tónlist að þínum þörfum (stíl, efni, eiginleikar), virkjaðu/slökktu á viðbætur í
   einn smellur

## Sýnishornsmynd

|                          Spilaraskjár (albúmslitaþema & umhverfisljós)                                         |
|:---------------------------------------------------------------------------------------------------------:|
|![Screenshot1](https://github.com/th-ch/youtube-music/assets/16558115/53efdf73-b8fa-4d7b-a235-b96b91ea77fc)|

## Efni

- [Eiginleikar](#eiginleikar)
- [Tiltæk tengiforrit](#tiltæk-tengiforrit)
- [Þýðing](#þýðing)
- [Sækja](#sækja)
  - [Arch Linux](#arch-linux)
  - [MacOS](#macos)
  - [Windows](#windows)
    - [Hvernig á að setja upp án nettengingar? (í Windows)](#hvernig-á-að-setja-upp-án-nettengingar-í-windows)
- [Þemu](#þemu)
- [Þróun](#þróun)
- [Búðu til þín eigin viðbætur](#búðu-til-þín-eigin-viðbætur)
  - [Er að búa til viðbót](#er-að-búa-til-viðbót)
  - [Algeng notkunartilvik](#algeng-notkunartilvik)
- [Byggja](#byggja)
- [Framleiðsluforskoðun](#framleiðsluforskoðun)
- [Prófanir](#prófanir)
- [Leyfi](#leyfi)
- [Algengustu spurningar](#algengustu-spurningar)

## Eiginleikar:

- **Sjálfvirk staðfesting þegar gert er hlé** (Alltaf virkt): slökkva á
   ["Halda áfram að horfa?"](https://user-images.githubusercontent.com/61631665/129977894-01c60740-7ec6-4bf0-9a2c-25da24491b0e.png)
   popup sem gerir hlé á tónlist eftir ákveðinn tíma

 - Og meira...

## Tiltæk tengiforrit:

- **Auglýsingablokkari**: Lokaðu fyrir allar auglýsingar og rakningar úr kassanum

- **Albúmsaðgerðir**: Bætir Ódíslika, Mislíkt, Líkt, og Ólíkt til að nota þetta á öll lög á spilunarlista eða albúm

- **Albúmslitaþema**: Beitir kraftmikið þema og sjónrænum áhrifum sem byggjast á litavali albúmsins

- **Umhverfishamur**: Beitir lýsingaráhrifum með því að varpa mildum litum úr myndbandinu í bakgrunn skjásins

- **Hljóðþjöppur**: Notaðu þjöppun á hljóð (lækkar hljóðstyrk háværustu hluta merkis og hækkar hljóðstyrk í mýkstu hlutunum)

- **Þoka Leiðsagnarstika**: Gerir leiðsögustikuna gagnsæja og óskýrt

- **Farið Framhjá Aldurstakmörkunum**: Framhjá aldursstaðfestingu YouTube

- **Yfirskriftarval**: Virkja skjátexta

- **Fyrirferðarlítillhliðarstika**: Stilltu hliðarstikuna alltaf í þétta stillingu

- **Krossfæra**: Krossfæra á milli lög

- **Slökkva á Sjálfvirkri Spilun**: Gerir lag að byrja í "hlé" ham

- **[Discord](https://discord.com/) Rík Nærveru**: Sýndu vinum þínum hvað þú hlustar á
   með [Rík Nærveru](https://user-images.githubusercontent.com/28219076/104362104-a7a0b980-5513-11eb-9744-bb89eabe0016.png)

- **Niðurhalari**: Niðurhalum
MP3 [beint úr viðmótinu](https://user-images.githubusercontent.com/61631665/129977677-83a7d067-c192-45e1-98ae-b5a4927393be.png) [(youtube-dl)](https://github.com/ytdl-org/youtube-dl)

- **Veldibundiðrúmmál**: Gerir hljóðstyrkssleðann [veldisvísis](https://greasyfork.org/en/scripts/397686-youtube-music-fix-volume-ratio/)
  svo það er auðveldara að velja lægra hljóðstyrk.

- **Valmynd í Forriti**: [Gefur börum flott, dökkt útlit](https://user-images.githubusercontent.com/78568641/112215894-923dbf00-8c29-11eb-95c3-3ce15db27eca.png)

  > (sjá [þessa færslu](https://github.com/th-ch/youtube-music/issues/410#issuecomment-952060709) ef þú átt í vandræðum
  með að fá aðgang að valmyndinni eftir að hafa virkjað þessa viðbót og fela valmyndarvalkostinn)

- **Scrobbler**: Bætir við scrobbling stuðningi fyrir [Last.fm](https://www.last.fm/) og [ListenBrainz](https://listenbrainz.org/)

- **Lumia Stream**: Bætir við [Lumia Stream](https://lumiastream.com/) stuðningi

- **Söngtexti Snilld**: Bætir stuðningi við texta fyrir flest lög

- **Tónlist Saman**: Deila spilunarlista með öðrum. Þegar gestgjafinn spilar lag munu allir aðrir heyra sama lagið

- **Leiðsögn**: Næsta/Til baka leiðsagnarörvar beint samþættar í viðmótinu, eins og í uppáhalds vafranum þínum

- **Engin Google Innskráning**: Fjarlægðu Google innskráningarhnappa og tengla úr viðmótinu

- **Tilkynningar**: Birta tilkynningu þegar lag byrjar að spila
  ([gagnvirkartilkynningar](https://user-images.githubusercontent.com/78568641/114102651-63ce0e00-98d0-11eb-9dfe-c5a02bb54f9c.png) eru fáanlegar á Windows)

- **Mynd-í-Mynd**: Gerir kleift að skipta forritinu yfir í mynd-í-mynd stillingu

- **Spilunarhraði**: Hlustaðu hratt, hlustaðu hægt!
  [Bætir við sleða sem stjórnar lagahraðanum](https://user-images.githubusercontent.com/61631665/129976003-e55db5ba-bf42-448c-a059-26a009775e68.png)

- **Nákvæmshljóðstyrkur**: Stjórnaðu hljóðstyrknum nákvæmlega með músarhjóli/hraðtökkum, með sérsniðnum HUD og sérsniðnum hljóðstyrksþrepum

- **Flýtileiðir (og MPRIS)**: Leyfir að stilla alþjóðlegarflýtilyklar fyrir spilun (spila/gera hlé/næsta/fyrri) +
   óvirkja [media osd](https://user-images.githubusercontent.com/84923831/128601225-afa38c1f-dea8-4209-9f72-0f84c1dd8b54.png)
   með því að hnekkja miðlunarlyklum + virkja Ctrl/CMD + F til að leita + virkja linux mpris stuðning fyrir
   miðlunarlyklar + [sérsniðnir flýtilyklar](https://github.com/Araxeus/youtube-music/blob/1e591d6a3df98449bcda6e63baab249b28026148/providers/song-controls.js#L13-L50)
   fyrir [háþróaða notendur](https://github.com/th-ch/youtube-music/issues/106#issuecomment-952156902)
- **Slepptu Lögum sem Mislíkuðust**: Sleppir mislíkaði lög

- **Slepptu Þögnum**: Slepptu sjálfkrafa þagnarköflum í lögum

- [**Styrktarblokk**](https://github.com/ajayyy/SponsorBlock): Sleppur sjálfkrafa hlutum sem ekki eru tónlist, eins og inngangur/lok
  eða hlutar af tónlistarmyndböndum þar sem lag er ekki að spila

- **Miðlunarstýringarverkefnastikunnar**: Stjórnaðu spilun frá [Windows verkefnastikunni þinni](https://user-images.githubusercontent.com/78568641/111916130-24a35e80-8a82-11eb-80c8-5021c1aa27f4.png)

- **Snertistiku**: Sérsniðið Snertistikuútlit fyrir macOS

- **Tuna OBS**: Samþætting við [OBS](https://obsproject.com/)
  viðbótina [Tuna](https://obsproject.com/forum/resources/tuna.843/)

- **Myndbandgæðisbreyting**: Leyfir að breyta myndbandgæðum með
  [hnappi](https://user-images.githubusercontent.com/78568641/138574366-70324a5e-2d64-4f6a-acdd-dc2a2b9cecc5.png) á
  myndbandsyfirlaginu

- **Myndbandsrofi**: Bætir við [hnappi](https://user-images.githubusercontent.com/28893833/173663950-63e6610e-a532-49b7-9afa-54cb57ddfc15.png) til
  að skipta á milli myndbands/lagshams. Getur einnig valfrjálst fjarlægt allan myndbandsflipann

- **Sjónrænir**: Mismunandi tónlist sjónrænir

## Þýðing

Þú getur aðstoðað við þýðingar á [Hosted Weblate](https://hosted.weblate.org/projects/youtube-music/).

<a href="https://hosted.weblate.org/engage/youtube-music/">
  <img src="https://hosted.weblate.org/widget/youtube-music/i18n/multi-auto.svg" alt="translation status" />
  <img src="https://hosted.weblate.org/widget/youtube-music/i18n/287x66-black.png" alt="translation status 2" />
</a>

## Sækja

Þú getur skoðað [nýjustu útgáfuna](https://github.com/th-ch/youtube-music/releases/latest) til að finna fljótt
nýjustu útgáfuna.

### Arch Linux

Settu upp [`youtube-music-bin`](https://aur.archlinux.org/packages/youtube-music-bin) pakkann frá AUR. Fyrir AUR uppsetningarleiðbeiningar skaltu skoða
þessa [wiki síðu](https://wiki.archlinux.org/index.php/Arch_User_Repository#Installing_packages).

### MacOS

Þú getur sett upp appið með því að nota Homebrew (sjá [cask skilgreiningu](https://github.com/th-ch/homebrew-youtube-music))

```bash
brew install th-ch/youtube-music/youtube-music
```

Ef þú setur upp forritið handvirkt og færð villu "er skemmd og ekki er hægt að opna það," þegar þú ræsir forritið skaltu keyra eftirfarandi í flugstöðinni:

```bash
/usr/bin/xattr -cr /Applications/YouTube\ Music.app
```

### Windows

Þú getur notað [Scoop pakkastjórnun](https://scoop.sh) til að setja upp `youtube-music` pakkann frá
[`extras` fötunni](https://github.com/ScoopInstaller/Extras).

```bash
scoop bucket add extras
scoop install extras/youtube-music
```

Að öðrum kosti geturðu notað [Winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/), Windows 11s
opinber CLI pakkastjóri til að setja upp `th-ch.YouTubeMusic` pakkann.

*Athugið: Microsoft Defender SmartScreen gæti lokað uppsetningunni þar sem hún er frá „óþekktum útgefanda“. Þetta er einnig
satt fyrir handvirka uppsetningu þegar reynt er að keyra executable(.exe) eftir handvirkt niðurhal hér á github (sama
skrá).*

```bash
winget install th-ch.YouTubeMusic
```

#### Hvernig á að setja upp án nettengingar? (í Windows)

- Sæktu `*.nsis.7z` skrána fyrir _arkitektúr tækisins þíns_ á [útgáfusíðu](https://github.com/th-ch/youtube-music/releases/latest).
   - `x64` fyrir 64-bita Windows
   - `ia32` fyrir 32-bita Windows
   - `arm64` fyrir ARM64 Windows
- Sæktu uppsetningarforrit á útgáfusíðu. (`*-Setup.exe`)
- Settu þær í **sömu möppuna**.
- Keyrðu uppsetningarforritið.

## Þemu

Þú getur hlaðið CSS skrám til að breyta útliti forritsins (Valkostir > Sjónræn klip > Þemu).

Sum fyrirframskilgreind þemu eru fáanleg á https://github.com/kerichdev/themes-for-ytmdesktop-player.

## Þróun

```bash
git clone https://github.com/th-ch/youtube-music
cd youtube-music
pnpm install --frozen-lockfile
pnpm dev
```

## Búðu til þín eigin tengiforrit

Með því að nota tengiforrit geturðu:

- vinna með appið - `BrowserWindow` frá electron er sent til tengiforritsstjórans
- breyttu framhliðinni með því að vinna með HTML/CSS

### Er að búa til tengiforrit

Búðu til möppu í `src/plugins/YOUR-PLUGIN-NAME`:

- `index.ts`: aðal skránni af tengiforritið
```typescript
import style from './style.css?inline'; // flytja inn stíl sem inline

import { createPlugin } from '@/utils';

export default createPlugin({
  name: 'Plugin Label',
  restartNeeded: true, // ef gildi er satt, ytmusic sjá endurræsa gluggann
  config: {
    enabled: false,
  }, // sérsniðnastillingar þinn
  stylesheets: [style], // sérsniðnastílinn þinn
  menu: async ({ getConfig, setConfig }) => {
    // Allar *stillingaraðferðir eru umvafnar Lofor<T>
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

      // þú getur tengst við renderer tengiforritið
      ipc.handle('some-event', () => {
        return 'hello';
      });
    },
    // það kviknaði þegar stillingum var breytt
    onConfigChange(newConfig) { /* ... */ },
    // it fired when plugin disabled
    stop(context) { /* ... */ },
  },
  renderer: {
    async start(context) {
      console.log(await context.ipc.invoke('some-event'));
    },
    // Aðeins krókur sem er í boði fyrir renderer
    onPlayerApiReady(api: YoutubePlayer, context: RendererContext) {
      // stilltu stillingar viðbótarinnar auðveldlega
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

### Algeng notkunartilvik

- er að sprauta sérsniðnum CSS: búðu til `style.css` skrá í sömu möppu þá:

```typescript
// index.ts
import style from './style.css?inline'; // flytja inn stíl sem inline

import { createPlugin } from '@/utils';

export default createPlugin({
  name: 'Plugin Label',
  restartNeeded: true, // ef gildi er satt, ytmusic sjá endurræsa gluggann
  config: {
    enabled: false,
  }, // sérsniðnastillingar þinn
  stylesheets: [style], // sérsniðnastílinn þinn
  renderer() {} // skilgreina renderer krók
});
```

- Ef þú vilt breyta HTML:

```typescript
import { createPlugin } from '@/utils';

export default createPlugin({
  name: 'Plugin Label',
  restartNeeded: true, // ef gildi er satt, ytmusic sjá endurræsa gluggann
  config: {
    enabled: false,
  }, // sérsniðnastillingar þinn
  renderer() {
    // Fjarlægðu innskráningarhnappinn
    document.querySelector(".sign-in-link.ytmusic-nav-bar").remove();
  } // skilgreina renderer krók
});
```

- samskipti á milli að framan og aftan: hægt að gera með því að nota ipcMain eininguna frá electron. Sjá `index.ts` skrá og
   dæmi í 'styrktarblokk' tengiforritinu.

## Byggja

1. Klóna geymsluna
2. Fylgdu [þessa handbók](https://pnpm.io/installation) til að setja upp 'pnpm'
3. Keyrðu `pnpm install --frozen-lockfile` til að setja upp ósjálfstæði
4. Keyrðu `pnpm build:OS`

- `pnpm dist:win` - Windows
- `pnpm dist:linux` - Linux
- `pnpm dist:mac` - MacOS

Byggir appið fyrir macOS, Linux og Windows,
með því að nota [electron-builder](https://github.com/electron-userland/electron-builder).

## Framleiðsluforskoðun

```bash
pnpm start
```

## Prófanir

```bash
pnpm test
```

Notar [Playwright](https://playwright.dev/) til að prófa forritið.

## Leyfi

MIT © [th-ch](https://github.com/th-ch/youtube-music)

## Algengustu Spurningar

### Hvers vegna forritavalmynd birtist ekki?

Ef valmöguleikinn „Fela valmynd“ er á - þú getur sýnt valmyndina með <kbd>alt</kbd> lyklinum (eða <kbd>\`</kbd> [bakka]
ef þú notar viðbótina fyrir valmynd í forriti)
