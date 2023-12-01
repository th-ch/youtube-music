import { dialog } from 'electron';

import QualitySettingsTemplate from './templates/qualitySettingsTemplate.html?raw';

import { createPlugin } from '@/utils';
import { ElementFromHtml } from '@/plugins/utils/renderer';
import { t } from '@/i18n';

import type { YoutubePlayer } from '@/types/youtube-player';

export default createPlugin({
  name: () => t('plugins.quality-changer.name'),
  description: () => t('plugins.quality-changer.description'),
  restartNeeded: false,
  config: {
    enabled: false,
  },

  backend({ ipc, window }) {
    ipc.handle(
      'qualityChanger',
      async (qualityLabels: string[], currentIndex: number) =>
        await dialog.showMessageBox(window, {
          type: 'question',
          buttons: qualityLabels,
          defaultId: currentIndex,
          title: t(
            'plugins.quality-changer.backend.dialog.quality-changer.title',
          ),
          message: t(
            'plugins.quality-changer.backend.dialog.quality-changer.message',
          ),
          detail: t(
            'plugins.quality-changer.backend.dialog.quality-changer.detail',
            {
              quality: qualityLabels[currentIndex],
            },
          ),
          cancelId: -1,
        }),
    );
  },

  renderer: {
    qualitySettingsButton: ElementFromHtml(QualitySettingsTemplate),
    onPlayerApiReady(api: YoutubePlayer, context) {
      const getPlayer = () =>
        document.querySelector<HTMLVideoElement>('#player');
      const chooseQuality = () => {
        setTimeout(() => getPlayer()?.click());

        const qualityLevels = api.getAvailableQualityLevels();

        const currentIndex = qualityLevels.indexOf(api.getPlaybackQuality());

        (
          context.ipc.invoke(
            'qualityChanger',
            api.getAvailableQualityLabels(),
            currentIndex,
          ) as Promise<{ response: number }>
        ).then((promise) => {
          if (promise.response === -1) {
            return;
          }

          const newQuality = qualityLevels[promise.response];
          api.setPlaybackQualityRange(newQuality);
          api.setPlaybackQuality(newQuality);
        });
      };

      const setup = () => {
        document
          .querySelector('.top-row-buttons.ytmusic-player')
          ?.prepend(this.qualitySettingsButton);

        this.qualitySettingsButton.addEventListener('click', chooseQuality);
      };

      setup();
    },
    stop() {
      document
        .querySelector('.top-row-buttons.ytmusic-player')
        ?.removeChild(this.qualitySettingsButton);
    },
  },
});
