import { FastAverageColor } from 'fast-average-color';
import Color from 'color';

import style from './style.css?inline';

import { createPlugin } from '@/utils';
import { t } from '@/i18n';

const COLOR_KEY = '--ytmusic-album-color';
const DARK_COLOR_KEY = '--ytmusic-album-color-dark';

export default createPlugin<
  unknown,
  unknown,
  {
    color?: Color;
    darkColor?: Color;

    playerPage: HTMLElement | null;
    navBarBackground: HTMLElement | null;
    ytmusicPlayerBar: HTMLElement | null;
    playerBarBackground: HTMLElement | null;
    sidebarBig: HTMLElement | null;
    sidebarSmall: HTMLElement | null;
    ytmusicAppLayout: HTMLElement | null;

    getColor(key: string, alpha?: number): string;
    updateColor(): void;
  }
>({
  name: () => t('plugins.album-color-theme.name'),
  description: () => t('plugins.album-color-theme.description'),
  restartNeeded: true,
  config: {
    enabled: false,
  },
  stylesheets: [style],
  renderer: {
    playerPage: null,
    navBarBackground: null,
    ytmusicPlayerBar: null,
    playerBarBackground: null,
    sidebarBig: null,
    sidebarSmall: null,
    ytmusicAppLayout: null,

    start() {
      this.playerPage = document.querySelector<HTMLElement>('#player-page');
      this.navBarBackground = document.querySelector<HTMLElement>(
        '#nav-bar-background',
      );
      this.ytmusicPlayerBar =
        document.querySelector<HTMLElement>('ytmusic-player-bar');
      this.playerBarBackground = document.querySelector<HTMLElement>(
        '#player-bar-background',
      );
      this.sidebarBig = document.querySelector<HTMLElement>('#guide-wrapper');
      this.sidebarSmall = document.querySelector<HTMLElement>(
        '#mini-guide-background',
      );
      this.ytmusicAppLayout = document.querySelector<HTMLElement>('#layout');
    },
    onPlayerApiReady(playerApi) {
      const fastAverageColor = new FastAverageColor();

      document.addEventListener('videodatachange', async (event) => {
        if (event.detail.name !== 'dataloaded') return;

        const playerResponse = playerApi.getPlayerResponse();
        const thumbnail = playerResponse?.videoDetails?.thumbnail?.thumbnails?.at(0);
        if (!thumbnail) return;

        const albumColor = await fastAverageColor.getColorAsync(thumbnail.url)
          .catch((err) => {
            console.error(err);
            return null;
          });

        if (albumColor) {
          const target = Color(albumColor.hex);

          // this.darkColor = target.darken(0.3).rgb();
          // this.color = target.darken(0.15).rgb();

          // while (this.color.luminosity() > 0.5) {
          //   this.color = this.color?.darken(0.05);
          //   this.darkColor = this.darkColor?.darken(0.05);
          // }
          this.color = target.rgb();
          this.darkColor = this.color.darken(0.3);

          while (this.darkColor.luminosity() > 0.05) {
            this.color = this.color?.darken(0.05);
            this.darkColor = this.darkColor?.darken(0.05);
          }
          
          if (this.color.saturationl() >= 60) {
            this.color = this.color?.saturationl(60);
            this.darkColor = this.darkColor?.saturationl(60);
          }

          document.documentElement.style.setProperty(COLOR_KEY, `${~~this.color.red()}, ${~~this.color.green()}, ${~~this.color.blue()}`);
          document.documentElement.style.setProperty(DARK_COLOR_KEY, `${~~this.darkColor.red()}, ${~~this.darkColor.green()}, ${~~this.darkColor.blue()}`);
        } else {
          document.documentElement.style.setProperty(COLOR_KEY, '0, 0, 0');
          document.documentElement.style.setProperty(DARK_COLOR_KEY, '0, 0, 0');
        }

        this.updateColor();
      });
    },
    getColor(key: string, alpha = 1) {
      return `rgba(var(${key}), ${alpha})`;
    },
    updateColor() {
      const change = (element: HTMLElement | null, color: string) => {
        if (element) {
          element.style.backgroundColor = color;
        }
      };

      change(this.playerPage, this.getColor(DARK_COLOR_KEY));
      change(this.navBarBackground, this.getColor(COLOR_KEY));
      change(this.ytmusicPlayerBar, this.getColor(COLOR_KEY));
      change(this.playerBarBackground, this.getColor(COLOR_KEY));
      change(this.sidebarBig, this.getColor(COLOR_KEY));

      if (this.ytmusicAppLayout?.hasAttribute('player-page-open')) {
        change(this.sidebarSmall, this.getColor(DARK_COLOR_KEY));
      }

      const ytRightClickList = document.querySelector<HTMLElement>('tp-yt-paper-listbox');
      change(ytRightClickList, this.getColor(COLOR_KEY));
    },
  },
});
