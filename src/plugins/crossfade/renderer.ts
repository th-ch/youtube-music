import { Howl } from 'howler';

// Extracted from https://github.com/bitfasching/VolumeFader
import { VolumeFader } from './fader';

import builder, { CrossfadePluginConfig } from './index';

export default builder.createRenderer(({ getConfig, invoke }) => {
  let config: CrossfadePluginConfig;

  let transitionAudio: Howl; // Howler audio used to fade out the current music
  let firstVideo = true;
  let waitForTransition: Promise<unknown>;

  const getStreamURL = async (videoID: string): Promise<string> => invoke('audio-url', videoID);

  const getVideoIDFromURL = (url: string) => new URLSearchParams(url.split('?')?.at(-1)).get('v');

  const isReadyToCrossfade = () => transitionAudio && transitionAudio.state() === 'loaded';

  const watchVideoIDChanges = (cb: (id: string) => void) => {
    window.navigation.addEventListener('navigate', (event) => {
      const currentVideoID = getVideoIDFromURL(
        (event.currentTarget as Navigation).currentEntry?.url ?? '',
      );
      const nextVideoID = getVideoIDFromURL(event.destination.url ?? '');

      if (
        nextVideoID
        && currentVideoID
        && (firstVideo || nextVideoID !== currentVideoID)
      ) {
        if (isReadyToCrossfade()) {
          crossfade(() => {
            cb(nextVideoID);
          });
        } else {
          cb(nextVideoID);
          firstVideo = false;
        }
      }
    });
  };

  const createAudioForCrossfade = (url: string) => {
    if (transitionAudio) {
      transitionAudio.unload();
    }

    transitionAudio = new Howl({
      src: url,
      html5: true,
      volume: 0,
    });
    syncVideoWithTransitionAudio();
  };

  const syncVideoWithTransitionAudio = () => {
    const video = document.querySelector('video')!;

    const videoFader = new VolumeFader(video, {
      fadeScaling: config.fadeScaling,
      fadeDuration: config.fadeInDuration,
    });

    transitionAudio.play();
    transitionAudio.seek(video.currentTime);

    video.addEventListener('seeking', () => {
      transitionAudio.seek(video.currentTime);
    });

    video.addEventListener('pause', () => {
      transitionAudio.pause();
    });

    video.addEventListener('play', () => {
      transitionAudio.play();
      transitionAudio.seek(video.currentTime);

      // Fade in
      const videoVolume = video.volume;
      video.volume = 0;
      videoFader.fadeTo(videoVolume);
    });

    // Exit just before the end for the transition
    const transitionBeforeEnd = async () => {
      if (
        video.currentTime >= video.duration - config.secondsBeforeEnd
        && isReadyToCrossfade()
      ) {
        video.removeEventListener('timeupdate', transitionBeforeEnd);

        // Go to next video - XXX: does not support "repeat 1" mode
        document.querySelector<HTMLButtonElement>('.next-button')?.click();
      }
    };

    video.addEventListener('timeupdate', transitionBeforeEnd);
  };

  const onApiLoaded = () => {
    watchVideoIDChanges(async (videoID) => {
      await waitForTransition;
      const url = await getStreamURL(videoID);
      if (!url) {
        return;
      }

      createAudioForCrossfade(url);
    });
  };

  const crossfade = (cb: () => void) => {
    if (!isReadyToCrossfade()) {
      cb();
      return;
    }

    let resolveTransition: () => void;
    waitForTransition = new Promise<void>((resolve) => {
      resolveTransition = resolve;
    });

    const video = document.querySelector('video')!;

    const fader = new VolumeFader(transitionAudio._sounds[0]._node, {
      initialVolume: video.volume,
      fadeScaling: config.fadeScaling,
      fadeDuration: config.fadeOutDuration,
    });

    // Fade out the music
    video.volume = 0;
    fader.fadeOut(() => {
      resolveTransition();
      cb();
    });
  };

  return {
    onLoad() {
      document.addEventListener('apiLoaded', async () => {
        config = await getConfig();
        onApiLoaded();
      }, {
        once: true,
        passive: true,
      });
    },
    onConfigChange(newConfig) {
      config = newConfig;
    },
  };
});
