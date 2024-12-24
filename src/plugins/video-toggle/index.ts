import buttonTemplate from './templates/button_template.html?raw';
import forceHideStyle from './force-hide.css?inline';
import buttonSwitcherStyle from './button-switcher.css?inline';

import { createPlugin } from '@/utils';
import { moveVolumeHud as preciseVolumeMoveVolumeHud } from '@/plugins/precise-volume/renderer';
import { ElementFromHtml } from '@/plugins/utils/renderer';
import { ThumbnailElement } from '@/types/get-player-response';
import { t } from '@/i18n';
import { MenuTemplate } from '@/menu';

export type VideoTogglePluginConfig = {
  enabled: boolean;
  hideVideo: boolean;
  mode: 'custom' | 'native' | 'disabled';
  forceHide: boolean;
  align: 'left' | 'middle' | 'right';
};

export default createPlugin({
  name: () => t('plugins.video-toggle.name'),
  description: () => t('plugins.video-toggle.description'),
  restartNeeded: true,
  config: {
    enabled: false,
    hideVideo: false,
    mode: 'custom',
    forceHide: false,
    align: 'left',
  } as VideoTogglePluginConfig,
  stylesheets: [buttonSwitcherStyle, forceHideStyle],
  menu: async ({ getConfig, setConfig }): Promise<MenuTemplate> => {
    const config = await getConfig();

    return [
      {
        label: t('plugins.video-toggle.menu.mode.label'),
        submenu: [
          {
            label: t('plugins.video-toggle.menu.mode.submenu.custom'),
            type: 'radio',
            checked: config.mode === 'custom',
            click() {
              setConfig({ mode: 'custom' });
            },
          },
          {
            label: t('plugins.video-toggle.menu.mode.submenu.native'),
            type: 'radio',
            checked: config.mode === 'native',
            click() {
              setConfig({ mode: 'native' });
            },
          },
          {
            label: t('plugins.video-toggle.menu.mode.submenu.disabled'),
            type: 'radio',
            checked: config.mode === 'disabled',
            click() {
              setConfig({ mode: 'disabled' });
            },
          },
        ],
      },
      {
        label: t('plugins.video-toggle.menu.align.label'),
        submenu: [
          {
            label: t('plugins.video-toggle.menu.align.submenu.left'),
            type: 'radio',
            checked: config.align === 'left',
            click() {
              setConfig({ align: 'left' });
            },
          },
          {
            label: t('plugins.video-toggle.menu.align.submenu.middle'),
            type: 'radio',
            checked: config.align === 'middle',
            click() {
              setConfig({ align: 'middle' });
            },
          },
          {
            label: t('plugins.video-toggle.menu.align.submenu.right'),
            type: 'radio',
            checked: config.align === 'right',
            click() {
              setConfig({ align: 'right' });
            },
          },
        ],
      },
      {
        label: t('plugins.video-toggle.menu.force-hide'),
        type: 'checkbox',
        checked: config.forceHide,
        click(item) {
          setConfig({ forceHide: item.checked });
        },
      },
    ];
  },

  renderer: {
    config: null as VideoTogglePluginConfig | null,
    applyStyleClass: (config: VideoTogglePluginConfig) => {
      if (config.forceHide) {
        document.body.classList.add('video-toggle-force-hide');
        document.body.classList.remove('video-toggle-custom-mode');
      } else if (!config.mode || config.mode === 'custom') {
        document.body.classList.add('video-toggle-custom-mode');
        document.body.classList.remove('video-toggle-force-hide');
      }
    },
    async start({ getConfig }) {
      const config = await getConfig();
      this.applyStyleClass(config);

      if (config.forceHide) {
        return;
      }

      switch (config.mode) {
        case 'native': {
          document
            .querySelector('ytmusic-player-page')
            ?.setAttribute('has-av-switcher', '');
          document
            .querySelector('ytmusic-player')
            ?.setAttribute('has-av-switcher', '');
          document
            .querySelector('ytmusic-av-toggle')
            ?.removeAttribute('toggle-disabled');
          return;
        }

        case 'disabled': {
          document
            .querySelector('ytmusic-player-page')
            ?.removeAttribute('has-av-switcher');
          document
            .querySelector('ytmusic-player')
            ?.removeAttribute('has-av-switcher');
          document
            .querySelector('ytmusic-av-toggle')
            ?.setAttribute('toggle-disabled', '');
          return;
        }
      }
    },
    async onPlayerApiReady(api, { getConfig }) {
      const config = await getConfig();
      this.config = config;

      const moveVolumeHud = window.mainConfig.plugins.isEnabled(
        'precise-volume',
      )
        ? (preciseVolumeMoveVolumeHud as (_: boolean) => void)
        : () => {};

      const player = document.querySelector<
        HTMLElement & { videoMode_: boolean }
      >('ytmusic-player');
      const video = document.querySelector<HTMLVideoElement>('video');

      const switchButtonDiv = ElementFromHtml(buttonTemplate);

      const forceThumbnail = (img: HTMLImageElement) => {
        const thumbnails: ThumbnailElement[] =
          api?.getPlayerResponse()?.videoDetails?.thumbnail?.thumbnails ?? [];
        if (thumbnails && thumbnails.length > 0) {
          const thumbnail = thumbnails.at(-1)?.url.split('?')[0];
          if (thumbnail) img.src = thumbnail;
        }
      };

      const setVideoState = (showVideo: boolean) => {
        if (this.config) {
          this.config.hideVideo = !showVideo;
        }
        window.mainConfig.plugins.setOptions('video-toggle', config);

        const checkbox = document.querySelector<HTMLInputElement>(
          '.video-switch-button-checkbox',
        ); // custom mode
        if (checkbox) checkbox.checked = !config.hideVideo;

        if (player) {
          player.style.margin = showVideo ? '' : 'auto 0px';
          player.setAttribute(
            'playback-mode',
            showVideo ? 'OMV_PREFERRED' : 'ATV_PREFERRED',
          );

          document.querySelector<HTMLElement>(
            '#song-video.ytmusic-player',
          )!.style.display = showVideo ? 'block' : 'none';
          document.querySelector<HTMLElement>('#song-image')!.style.display =
            showVideo ? 'none' : 'block';

          if (showVideo && video && !video.style.top) {
            video.style.top = `${
              (player.clientHeight - video.clientHeight) / 2
            }px`;
          }

          moveVolumeHud(showVideo);
        }
      };

      const videoStarted = () => {
        if (
          api.getPlayerResponse().videoDetails.musicVideoType ===
          'MUSIC_VIDEO_TYPE_ATV'
        ) {
          // Video doesn't exist -> switch to song mode
          setVideoState(false);
          // Hide toggle button
          switchButtonDiv.style.display = 'none';
        } else {
          const songImage =
            document.querySelector<HTMLImageElement>('#song-image img');
          if (!songImage) {
            return;
          }
          // Switch to high-res thumbnail
          forceThumbnail(songImage);
          // Show toggle button
          switchButtonDiv.style.display = 'initial';
          // Change display to video mode if video exist & video is hidden & option.hideVideo = false
          if (
            !this.config?.hideVideo &&
            document.querySelector<HTMLElement>('#song-video.ytmusic-player')
              ?.style.display === 'none'
          ) {
            setVideoState(true);
          } else {
            moveVolumeHud(!this.config?.hideVideo);
          }
        }
      };

      /**
       * On load, after a delay, the page overrides the playback-mode to 'OMV_PREFERRED' which causes weird aspect ratio in the image container
       * this function fix the problem by overriding that override :)
       */
      const forcePlaybackMode = () => {
        if (player) {
          const playbackModeObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
              if (mutation.target instanceof HTMLElement) {
                const target = mutation.target;
                if (target.getAttribute('playback-mode') !== 'ATV_PREFERRED') {
                  playbackModeObserver.disconnect();
                  target.setAttribute('playback-mode', 'ATV_PREFERRED');
                }
              }
            }
          });
          playbackModeObserver.observe(player, {
            attributeFilter: ['playback-mode'],
          });
        }
      };

      const observeThumbnail = () => {
        const playbackModeObserver = new MutationObserver((mutations) => {
          if (!player?.videoMode_) {
            return;
          }

          for (const mutation of mutations) {
            if (mutation.target instanceof HTMLImageElement) {
              const target = mutation.target;
              if (!target.src.startsWith('data:')) {
                continue;
              }

              forceThumbnail(target);
            }
          }
        });
        playbackModeObserver.observe(
          document.querySelector('#song-image img')!,
          { attributeFilter: ['src'] },
        );
      };

      if (config.mode !== 'native' && config.mode != 'disabled') {
        document
          .querySelector<HTMLVideoElement>('#player')
          ?.prepend(switchButtonDiv);

        setVideoState(!config.hideVideo);
        forcePlaybackMode();
        // Fix black video
        if (video) {
          video.style.height = 'auto';
        }

        //Prevents bubbling to the player which causes it to stop or resume
        switchButtonDiv.addEventListener('click', (e) => {
          e.stopPropagation();
        });

        // Button checked = show video
        switchButtonDiv.addEventListener('change', (e) => {
          const target = e.target as HTMLInputElement;

          setVideoState(target.checked);
        });

        video?.addEventListener('ytmd:src-changed', videoStarted);

        observeThumbnail();

        switch (config.align) {
          case 'right': {
            switchButtonDiv.style.left = 'calc(100% - 240px)';
            return;
          }

          case 'middle': {
            switchButtonDiv.style.left = 'calc(50% - 120px)';
            return;
          }

          default:
          case 'left': {
            switchButtonDiv.style.left = '0px';
          }
        }
      }
    },
    onConfigChange(newConfig) {
      this.config = newConfig;
      this.applyStyleClass(newConfig);
    },
  },
});
