export interface VideoSwitchButtonProps {
  onClick?: (event: MouseEvent) => void;
  onChange?: (event: Event) => void;
  text: string;
}

export const VideoSwitchButton = (props: VideoSwitchButtonProps) => (
  <div
    class="video-switch-button"
    on:click={props.onClick}
    onChange={props.onChange}
  >
    <input
      checked={true}
      class="video-switch-button-checkbox"
      type="checkbox"
    />
    <label class="video-switch-button-label" for="">
      <span class="video-switch-button-label-span">{props.text}</span>
    </label>
  </div>
);
