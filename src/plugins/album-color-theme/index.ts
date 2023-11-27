import { FastAverageColor } from 'fast-average-color';

import style from './style.css?inline';

import { createPlugin } from '@/utils';

export default createPlugin({
  name: 'Album Color Theme',
  restartNeeded: true,
  config: {
    enabled: false,
  },
  stylesheets: [style],
  renderer: {
    hexToHSL: (H: string) => {
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
    },
    hue: 0,
    saturation: 0,
    lightness: 0,

    changeElementColor: (element: HTMLElement | null, hue: number, saturation: number, lightness: number) => {
      if (element) {
        element.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      }
    },

    playerPage: null as HTMLElement | null,
    navBarBackground: null as HTMLElement | null,
    ytmusicPlayerBar: null as HTMLElement | null,
    playerBarBackground: null as HTMLElement | null,
    sidebarBig: null as HTMLElement | null,
    sidebarSmall: null as HTMLElement | null,
    ytmusicAppLayout: null as HTMLElement | null,

    start() {
      this.playerPage = document.querySelector<HTMLElement>('#player-page');
      this.navBarBackground = document.querySelector<HTMLElement>('#nav-bar-background');
      this.ytmusicPlayerBar = document.querySelector<HTMLElement>('ytmusic-player-bar');
      this.playerBarBackground = document.querySelector<HTMLElement>('#player-bar-background');
      this.sidebarBig = document.querySelector<HTMLElement>('#guide-wrapper');
      this.sidebarSmall = document.querySelector<HTMLElement>('#mini-guide-background');
      this.ytmusicAppLayout = document.querySelector<HTMLElement>('#layout');

      const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'attributes') {
            const isPageOpen = this.ytmusicAppLayout?.hasAttribute('player-page-open');
            if (isPageOpen) {
              this.changeElementColor(this.sidebarSmall, this.hue, this.saturation, this.lightness - 30);
            } else {
              if (this.sidebarSmall) {
                this.sidebarSmall.style.backgroundColor = 'black';
              }
            }
          }
        }
      });

      if (this.playerPage) {
        observer.observe(this.playerPage, { attributes: true });
      }
    },
    onPlayerApiReady(playerApi) {
      const fastAverageColor = new FastAverageColor();

      playerApi.addEventListener('videodatachange', (name: string) => {
        if (name === 'dataloaded') {
          const playerResponse = playerApi.getPlayerResponse();
          const thumbnail = playerResponse?.videoDetails?.thumbnail?.thumbnails?.at(0);
          if (thumbnail) {
            fastAverageColor.getColorAsync(thumbnail.url)
              .then((albumColor) => {
                if (albumColor) {
                  const [hue, saturation, lightness] = this.hexToHSL(albumColor.hex);
                  this.changeElementColor(this.playerPage, hue, saturation, lightness - 30);
                  this.changeElementColor(this.navBarBackground, hue, saturation, lightness - 15);
                  this.changeElementColor(this.ytmusicPlayerBar, hue, saturation, lightness - 15);
                  this.changeElementColor(this.playerBarBackground, hue, saturation, lightness - 15);
                  this.changeElementColor(this.sidebarBig, hue, saturation, lightness - 15);
                  if (this.ytmusicAppLayout?.hasAttribute('player-page-open')) {
                    this.changeElementColor(this.sidebarSmall, hue, saturation, lightness - 30);
                  }
                  const ytRightClickList = document.querySelector<HTMLElement>('tp-yt-paper-listbox');
                  this.changeElementColor(ytRightClickList, hue, saturation, lightness - 15);
                } else {
                  if (this.playerPage) {
                    this.playerPage.style.backgroundColor = '#000000';
                  }
                }
              })
              .catch((e) => console.error(e));
          }
        }
      });
    },
  }
});
