import { createMemo, For } from 'solid-js';

interface PlainLyricsProps {
  lyrics: string;
}

export const PlainLyrics = (props: PlainLyricsProps) => {
  const lines = createMemo(() => props.lyrics.split('\n'));

  return (
    <div class="plain-lyrics">
      <For each={lines()}>
        {(line) => {
          if (line.trim() === '') {
            return <br />;
          } else {
            return (
              <yt-formatted-string
                class="text-lyrics description ytmusic-description-shelf-renderer"
                text={{
                  runs: [{ text: line }],
                }}
              />
            );
          }
        }}
      </For>
    </div>
  );
};
