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

    getMixedColor(color: string, key: string, ratio?: number, alpha?: number): string;
    updateColor(): void;
  }
>({
  name: () => t('plugins.album-color-theme.name'),
  description: () => t('plugins.album-color-theme.description'),
  restartNeeded: false,
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

          this.darkColor = target.darken(0.3).rgb();
          this.color = target.darken(0.15).rgb();

          while (this.color.luminosity() > 0.5) {
            this.color = this.color?.darken(0.05);
            this.darkColor = this.darkColor?.darken(0.05);
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
    getMixedColor(color: string, key: string, ratio = 0.2, alpha = 1) {
      const keyColor = `rgba(var(${key}), ${alpha})`;
      return `color-mix(in srgb, ${color} ${Math.round((1 - ratio) * 100)}%, ${keyColor} ${Math.round(ratio * 100)}%)`;
    },
    updateColor() {
      const variableMap = {
        '--ytmusic-color-black1': '#212121',
        '--ytmusic-color-black2': '#181818',
        '--ytmusic-color-black3': '#030303',
        '--ytmusic-color-black4': '#030303',
        '--ytmusic-color-blackpure': '#000',
        '--dark-theme-background-color': '#212121',
        '--yt-spec-base-background': '#0f0f0f',
        '--yt-spec-raised-background': '#212121',
        '--yt-spec-menu-background': '#282828',
        '--yt-spec-static-brand-black': '#212121',
        '--yt-spec-static-overlay-background-solid': '#000',
        '--yt-spec-static-overlay-background-heavy': 'rgba(0,0,0,0.8)',
        '--yt-spec-static-overlay-background-medium': 'rgba(0,0,0,0.6)',
        '--yt-spec-static-overlay-background-medium-light': 'rgba(0,0,0,0.3)',
        '--yt-spec-static-overlay-background-light': 'rgba(0,0,0,0.1)',
        '--yt-spec-general-background-a': '#181818',
        '--yt-spec-general-background-b': '#0f0f0f',
        '--yt-spec-general-background-c': '#030303',
        '--yt-spec-snackbar-background': '#030303',
        '--yt-spec-filled-button-text': '#030303',
        '--yt-spec-black-1': '#282828',
        '--yt-spec-black-2': '#1f1f1f',
        '--yt-spec-black-3': '#161616',
        '--yt-spec-black-4': '#0d0d0d',
        '--yt-spec-black-pure': '#000',
        '--yt-spec-black-pure-alpha-5': 'rgba(0,0,0,0.05)',
        '--yt-spec-black-pure-alpha-10': 'rgba(0,0,0,0.1)',
        '--yt-spec-black-pure-alpha-15': 'rgba(0,0,0,0.15)',
        '--yt-spec-black-pure-alpha-30': 'rgba(0,0,0,0.3)',
        '--yt-spec-black-pure-alpha-60': 'rgba(0,0,0,0.6)',
        '--yt-spec-black-pure-alpha-80': 'rgba(0,0,0,0.8)',
        '--yt-spec-black-1-alpha-98': 'rgba(40,40,40,0.98)',
        '--yt-spec-black-1-alpha-95': 'rgba(40,40,40,0.95)',
      };
      Object.entries(variableMap).map(([variable, color]) => {
        document.documentElement.style.setProperty(variable, this.getMixedColor(color, COLOR_KEY), 'important');
      });

      document.body.style.setProperty('background', this.getMixedColor('#030303', COLOR_KEY), 'important');
      document.body.style.setProperty('--ytmusic-background', `linear-gradient(var(--ytmusic-general-background-a), var(--ytmusic-general-background-c))`, 'important');
    },
  },
});
