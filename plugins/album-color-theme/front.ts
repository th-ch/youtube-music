import { FastAverageColor } from 'fast-average-color';

import { ConfigType } from '../../config/dynamic';

function hexToHSL(H: string) {
  // Convert hex to RGB first
  let r = 0;
  let g = 0;
  let b = 0;
  if (H.length == 4) {
    r = Number('0x' + H[1] + H[1]);
    g = Number('0x' + H[2] + H[2]);
    b = Number('0x' + H[3] + H[3]);
  } else if (H.length == 7) {
    r = Number('0x' + H[1] + H[2]);
    g = Number('0x' + H[3] + H[4]);
    b = Number('0x' + H[5] + H[6]);
  }
  // Then to HSL
  r /= 255;
  g /= 255;
  b /= 255;
  const cmin = Math.min(r, g, b);
  const cmax = Math.max(r, g, b);
  const delta = cmax - cmin;
  let h: number;
  let s: number;
  let l: number;

  if (delta == 0) {
    h = 0;
  } else if (cmax == r) {
    h = ((g - b) / delta) % 6;
  } else if (cmax == g) {
    h = ((b - r) / delta) + 2;
  } else {
    h = ((r - g) / delta) + 4;
  }

  h = Math.round(h * 60);

  if (h < 0) {
    h += 360;
  }

  l = (cmax + cmin) / 2;
  s = delta == 0 ? 0 : delta / (1 - Math.abs((2 * l) - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  //return "hsl(" + h + "," + s + "%," + l + "%)";
  return [h,s,l];
}

let hue = 0;
let saturation = 0;
let lightness = 0;

function changeElementColor(element: HTMLElement | null, hue: number, saturation: number, lightness: number){
  if (element) {
    element.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
}

export default (_: ConfigType<'album-color-theme'>) => {
  // updated elements
  const playerPage = document.querySelector<HTMLElement>('#player-page');
  const navBarBackground = document.querySelector<HTMLElement>('#nav-bar-background');
  const ytmusicPlayerBar = document.querySelector<HTMLElement>('ytmusic-player-bar');
  const playerBarBackground = document.querySelector<HTMLElement>('#player-bar-background');
  const sidebarBig = document.querySelector<HTMLElement>('#guide-wrapper');
  const sidebarSmall = document.querySelector<HTMLElement>('#mini-guide-background');
  const ytmusicAppLayout = document.querySelector<HTMLElement>('#layout');

  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'attributes') {
        const isPageOpen = ytmusicAppLayout?.hasAttribute('player-page-open');
        if (isPageOpen) {
          changeElementColor(sidebarSmall, hue, saturation, lightness - 30);
        } else {
          if (sidebarSmall) {
            sidebarSmall.style.backgroundColor = 'black';
          }
        }
      }
    }
  });

  if (playerPage) {
    observer.observe(playerPage, { attributes: true });
  }

  document.addEventListener('apiLoaded', (apiEvent) => {
    const fastAverageColor = new FastAverageColor();

    apiEvent.detail.addEventListener('videodatachange', (name: string) => {
      if (name === 'dataloaded') {
        const playerResponse = apiEvent.detail.getPlayerResponse();
        const thumbnail = playerResponse?.videoDetails?.thumbnail?.thumbnails?.at(0);
        if (thumbnail) {
          fastAverageColor.getColorAsync(thumbnail.url)
            .then((albumColor) => {
              if (albumColor) {
                [hue, saturation, lightness] = hexToHSL(albumColor.hex);
                changeElementColor(playerPage, hue, saturation, lightness - 30);
                changeElementColor(navBarBackground, hue, saturation, lightness - 15);
                changeElementColor(ytmusicPlayerBar, hue, saturation, lightness - 15);
                changeElementColor(playerBarBackground, hue, saturation, lightness - 15);
                changeElementColor(sidebarBig, hue, saturation, lightness - 15);
                if (ytmusicAppLayout?.hasAttribute('player-page-open')) {
                  changeElementColor(sidebarSmall, hue, saturation, lightness - 30);
                }
                const ytRightClickList = document.querySelector<HTMLElement>('tp-yt-paper-listbox');
                changeElementColor(ytRightClickList, hue, saturation, lightness - 15);
              } else {
                if (playerPage) {
                  playerPage.style.backgroundColor = '#000000';
                }
              }
            })
            .catch((e) => console.error(e));
        }
      }
    });
  });
};
