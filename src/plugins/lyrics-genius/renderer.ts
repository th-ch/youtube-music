import { LoggerPrefix } from '@/utils';

import { t } from '@/i18n';

import { defaultTrustedTypePolicy } from '@/utils/trusted-types';

import type { SongInfo } from '@/providers/song-info';
import type { RendererContext } from '@/types/contexts';
import type { LyricsGeniusPluginConfig } from '@/plugins/lyrics-genius/index';

export const onRendererLoad = ({
  ipc: { invoke, on },
}: RendererContext<LyricsGeniusPluginConfig>) => {
  const setLyrics = (lyricsContainer: Element, lyrics: string | null) => {
    const targetHtml = `
      <div id="contents" class="style-scope ytmusic-section-list-renderer description ytmusic-description-shelf-renderer genius-lyrics">
        ${
          lyrics?.replaceAll(/\r\n|\r|\n/g, '<br/>') ??
          'Could not retrieve lyrics from genius'
        }
      </div>
      <yt-formatted-string class="footer style-scope ytmusic-description-shelf-renderer" style="align-self: baseline">
      </yt-formatted-string>
    `;
    (lyricsContainer.innerHTML as string | TrustedHTML) =
      defaultTrustedTypePolicy
        ? defaultTrustedTypePolicy.createHTML(targetHtml)
        : targetHtml;

    if (lyrics) {
      const footer = lyricsContainer.querySelector('.footer');

      if (footer) {
        footer.textContent = 'Source: Genius';
      }
    }
  };

  let unregister: (() => void) | null = null;

  on('ytmd:update-song-info', (extractedSongInfo: SongInfo) => {
    unregister?.();

    setTimeout(async () => {
      const tabList = document.querySelectorAll<HTMLElement>('tp-yt-paper-tab');
      const tabs = {
        upNext: tabList[0],
        lyrics: tabList[1],
        discover: tabList[2],
      };

      // Check if disabled
      if (!tabs.lyrics?.hasAttribute('disabled')) return;

      const lyrics = (await invoke(
        'search-genius-lyrics',
        extractedSongInfo,
      )) as string | null;

      if (!lyrics) {
        // Delete previous lyrics if tab is open and couldn't get new lyrics
        tabs.upNext.click();

        return;
      }

      if (window.electronIs.dev()) {
        console.log(
          LoggerPrefix,
          t('plugins.lyric-genius.renderer.fetched-lyrics'),
        );
      }

      const tryToInjectLyric = (callback?: () => void) => {
        const lyricsContainer = document.querySelector(
          '[page-type="MUSIC_PAGE_TYPE_TRACK_LYRICS"] > ytmusic-message-renderer',
        );

        if (lyricsContainer) {
          callback?.();

          setLyrics(lyricsContainer, lyrics);
          applyLyricsTabState();
        }
      };

      const applyLyricsTabState = () => {
        if (lyrics) {
          tabs.lyrics.removeAttribute('disabled');
          tabs.lyrics.removeAttribute('aria-disabled');
        } else {
          tabs.lyrics.setAttribute('disabled', '');
          tabs.lyrics.setAttribute('aria-disabled', '');
        }
      };

      const lyricsTabHandler = () => {
        const tabContainer = document.querySelector('ytmusic-tab-renderer');
        if (!tabContainer) return;

        const observer = new MutationObserver((_, observer) => {
          tryToInjectLyric(() => observer.disconnect());
        });

        observer.observe(tabContainer, {
          attributes: true,
          childList: true,
          subtree: true,
        });
      };

      applyLyricsTabState();

      tabs.discover.addEventListener('click', applyLyricsTabState);
      tabs.lyrics.addEventListener('click', lyricsTabHandler);
      tabs.upNext.addEventListener('click', applyLyricsTabState);

      tryToInjectLyric();

      unregister = () => {
        tabs.discover.removeEventListener('click', applyLyricsTabState);
        tabs.lyrics.removeEventListener('click', lyricsTabHandler);
        tabs.upNext.removeEventListener('click', applyLyricsTabState);
      };
    }, 500);
  });
};
