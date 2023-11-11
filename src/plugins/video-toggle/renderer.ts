import buttonTemplate from './templates/button_template.html?raw';

import builder, { type VideoTogglePluginConfig } from './index';

import { ElementFromHtml } from '../utils/renderer';

import { moveVolumeHud as preciseVolumeMoveVolumeHud } from '../precise-volume/renderer';

import { YoutubePlayer } from '../../types/youtube-player';
import { ThumbnailElement } from '../../types/get-player-response';


export default builder.createRenderer(({ getConfig }) => {
  const moveVolumeHud = window.mainConfig.plugins.isEnabled('precise-volume') ?
    preciseVolumeMoveVolumeHud as (_: boolean) => void
    : (() => {});

  let config: VideoTogglePluginConfig = builder.config;
  let player: HTMLElement & { videoMode_: boolean } | null;
  let video: HTMLVideoElement | null;
  let api: YoutubePlayer;

  const switchButtonDiv = ElementFromHtml(buttonTemplate);

  function setup(e: CustomEvent<YoutubePlayer>) {
    api = e.detail;
    player = document.querySelector<(HTMLElement & { videoMode_: boolean; })>('ytmusic-player');
    video = document.querySelector<HTMLVideoElement>('video');

    document.querySelector<HTMLVideoElement>('#player')?.prepend(switchButtonDiv);

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

    video?.addEventListener('srcChanged', videoStarted);

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

  function setVideoState(showVideo: boolean) {
    config.hideVideo = !showVideo;
    window.mainConfig.plugins.setOptions('video-toggle', config);

    const checkbox = document.querySelector<HTMLInputElement>('.video-switch-button-checkbox'); // custom mode
    if (checkbox) checkbox.checked = !config.hideVideo;

    if (player) {
      player.style.margin = showVideo ? '' : 'auto 0px';
      player.setAttribute('playback-mode', showVideo ? 'OMV_PREFERRED' : 'ATV_PREFERRED');

      document.querySelector<HTMLElement>('#song-video.ytmusic-player')!.style.display = showVideo ? 'block' : 'none';
      document.querySelector<HTMLElement>('#song-image')!.style.display = showVideo ? 'none' : 'block';

      if (showVideo && video && !video.style.top) {
        video.style.top = `${(player.clientHeight - video.clientHeight) / 2}px`;
      }

      moveVolumeHud(showVideo);
    }
  }

  function videoStarted() {
    if (api.getPlayerResponse().videoDetails.musicVideoType === 'MUSIC_VIDEO_TYPE_ATV') {
      // Video doesn't exist -> switch to song mode
      setVideoState(false);
      // Hide toggle button
      switchButtonDiv.style.display = 'none';
    } else {
      const songImage = document.querySelector<HTMLImageElement>('#song-image img');
      if (!songImage) {
        return;
      }
      // Switch to high-res thumbnail
      forceThumbnail(songImage);
      // Show toggle button
      switchButtonDiv.style.display = 'initial';
      // Change display to video mode if video exist & video is hidden & option.hideVideo = false
      if (!config.hideVideo && document.querySelector<HTMLElement>('#song-video.ytmusic-player')?.style.display === 'none') {
        setVideoState(true);
      } else {
        moveVolumeHud(!config.hideVideo);
      }
    }
  }

// On load, after a delay, the page overrides the playback-mode to 'OMV_PREFERRED' which causes weird aspect ratio in the image container
// this function fix the problem by overriding that override :)
  function forcePlaybackMode() {
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
      playbackModeObserver.observe(player, { attributeFilter: ['playback-mode'] });
    }
  }

  function observeThumbnail() {
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
    playbackModeObserver.observe(document.querySelector('#song-image img')!, { attributeFilter: ['src'] });
  }

  function forceThumbnail(img: HTMLImageElement) {
    const thumbnails: ThumbnailElement[] = (document.querySelector('#movie_player') as unknown as YoutubePlayer).getPlayerResponse()?.videoDetails?.thumbnail?.thumbnails ?? [];
    if (thumbnails && thumbnails.length > 0) {
      const thumbnail = thumbnails.at(-1)?.url.split('?')[0];
      if (typeof thumbnail === 'string') img.src = thumbnail;
    }
  }

  const applyStyleClass = (config: VideoTogglePluginConfig) => {
    if (config.forceHide) {
      document.body.classList.add('video-toggle-force-hide');
      document.body.classList.remove('video-toggle-custom-mode');
    } else if (!config.mode || config.mode === 'custom') {
      document.body.classList.add('video-toggle-custom-mode');
      document.body.classList.remove('video-toggle-force-hide');
    }
  };

  return {
    async onLoad() {
      config = await getConfig();
      applyStyleClass(config);

      if (config.forceHide) {
        return;
      }

      switch (config.mode) {
        case 'native': {
          document.querySelector('ytmusic-player-page')?.setAttribute('has-av-switcher', '');
          document.querySelector('ytmusic-player')?.setAttribute('has-av-switcher', '');
          return;
        }

        case 'disabled': {
          document.querySelector('ytmusic-player-page')?.removeAttribute('has-av-switcher');
          document.querySelector('ytmusic-player')?.removeAttribute('has-av-switcher');
          return;
        }

        default:
        case 'custom': {
          document.addEventListener('apiLoaded', setup, { once: true, passive: true });
        }
      }
    },
    onConfigChange(newConfig) {
      config = newConfig;

      applyStyleClass(newConfig);
    }
  };
});
