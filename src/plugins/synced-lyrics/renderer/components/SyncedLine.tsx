import { createEffect, createMemo, createResource, For, Show } from 'solid-js';

import { currentTime } from './LyricsContainer';

import { config } from '../renderer';
import { _ytAPI, syncedLyricsIPC } from '..';

import type { LineLyrics } from '../../types';

interface SyncedLineProps {
  line: LineLyrics;
}

export const SyncedLine = ({ line }: SyncedLineProps) => {
  const status = createMemo(() => {
    const current = currentTime();

    if (line.timeInMs >= current) return 'upcoming';
    if (current - line.timeInMs >= line.duration) return 'previous';
    return 'current';
  });

  let ref: HTMLDivElement | undefined;
  createEffect(() => {
    if (status() === 'current') {
      ref?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  const text = createMemo(() => {
    if (!line.text.trim()) {
      return config()?.defaultTextString ?? '';
    }

    return line.text;
  });

  const [romaji] = createResource<string, unknown, unknown>(
    () => 1,
    async () => {
      // prettier-ignore
      return await syncedLyricsIPC()?.invoke('synced-lyrics:romanize-line', text());
    }
  );

  if (!text()) {
    return (
      <yt-formatted-string
        text={{
          runs: [{ text: '' }],
        }}
      />
    );
  }

  return (
    <div
      ref={ref}
      class={`synced-line ${status()}`}
      onClick={() => {
        _ytAPI?.seekTo(line.timeInMs / 1000);
      }}
    >
      <div dir="auto" class="description ytmusic-description-shelf-renderer">
        <yt-formatted-string
          text={{
            runs: [{ text: config()?.showTimeCodes ? `[${line.time}] ` : '' }],
          }}
        />

        <div
          class="text-lyrics"
          ref={(div: HTMLDivElement) => {
            div.style.setProperty(
              '--lyrics-duration',
              `${line.duration / 1000}s`,
              'important'
            );

            console.log(div, div.style.getPropertyValue('--lyrics-duration'));
          }}
          style={{ display: 'flex', 'flex-direction': 'column' }}
        >
          <span>
            <For each={text().split(' ')}>
              {(word, index) => {
                return (
                  <span
                    style={{
                      'transition-delay': `${index() * 0.05}s`,
                      'animation-delay': `${index() * 0.05}s`,
                    }}
                  >
                    <yt-formatted-string
                      text={{
                        runs: [{ text: `${word} ` }],
                      }}
                    />
                  </span>
                );
              }}
            </For>
          </span>

          <Show
            when={
              text()?.trim() &&
              romaji()?.trim() &&
              text()?.trim() !== romaji()?.trim()
            }
          >
            <span class="romaji">
              <For each={romaji()!.split(' ')}>
                {(word, index) => {
                  return (
                    <span
                      style={{
                        'transition-delay': `${index() * 0.05}s`,
                        'animation-delay': `${index() * 0.05}s`,
                      }}
                    >
                      <yt-formatted-string
                        text={{
                          runs: [{ text: `${word} ` }],
                        }}
                      />
                    </span>
                  );
                }}
              </For>
            </span>
          </Show>
        </div>
      </div>
    </div>
  );
};
