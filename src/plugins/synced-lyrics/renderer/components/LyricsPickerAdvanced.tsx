import { createSignal } from 'solid-js';

export const [lyricsOffset, setLyricsOffset] = createSignal(0);

export const LyricsPickerAdvanced = () => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        'flex-direction': 'row',
        'align-items': 'center',
        'justify-content': 'center',
      }}
    >
      <yt-formatted-string
        class="description ytmusic-description-shelf-renderer"
        text={{ runs: [{ text: 'Lyrics Offset (ms):' }] }}
      />
      <div style={{ display: 'flex', 'flex-direction': 'row' }}>
        <input
          class="lrcpkradv-offset"
          type="number"
          step={50}
          value={lyricsOffset()}
          onInput={(e) => {
            let value = e.target.valueAsNumber;
            if (isNaN(value)) value = 0;

            setLyricsOffset(value);
          }}
        />
        <span>
          <button
            class="lrcpkradv-offset-btn"
            onclick={() => setLyricsOffset((old) => old - 50)}
          >
            -
          </button>
          /
          <button
            class="lrcpkradv-offset-btn"
            onclick={() => setLyricsOffset((old) => old + 50)}
          >
            +
          </button>
        </span>
      </div>
    </div>
  );
};
