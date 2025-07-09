export interface VideoSwitchButtonProps {
  onClick?: (event: MouseEvent) => void;
  onChange?: (event: Event) => void;
  songButtonText: string;
  videoButtonText: string;
}

export const VideoSwitchButton = (props: VideoSwitchButtonProps) => (
  <div
    class="video-switch-button"
    data-video-button-text={props.videoButtonText}
    on:click={props.onClick}
    onChange={props.onChange}
  >
    <input
      checked={true}
      id="video-toggle-video-switch-button-checkbox"
      class="video-switch-button-checkbox"
      type="checkbox"
    />
    <label class="video-switch-button-label" for="video-toggle-video-switch-button-checkbox">
      <span class="video-switch-button-label-span">{props.songButtonText}</span>
    </label>
  </div>
);
