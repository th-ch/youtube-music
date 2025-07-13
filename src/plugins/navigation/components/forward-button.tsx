export interface ForwardButtonProps {
  onClick?: (e: MouseEvent) => void;
  title: string;
}

export const ForwardButton = (props: ForwardButtonProps) => (
  <div
    class="style-scope ytmusic-pivot-bar-renderer navigation-item"
    onClick={(e) => props.onClick?.(e)}
    role="tab"
    tab-id="FEmusic_next"
  >
    <mdui-button-icon
      variant="standard"
      onClick={(e) => props.onClick?.(e)}
      style={{ width: '32px', height: '32px' }}
    >
      <svg
        preserveAspectRatio="xMidYMid meet"
        style={{
          'fill': 'var(--iron-icon-fill-color, currentcolor)',
          'pointer-events': 'none',
          'display': 'block',
          'width': '100%',
          'height': '100%',
          'padding': '20%',
        }}
        viewBox="0 0 492 492"
      >
        <g>
          <path
            d="M382.7,226.8L163.7,7.9c-5.1-5.1-11.8-7.9-19-7.9s-14,2.8-19,7.9L109.5,24c-10.5,10.5-10.5,27.6,0,38.1
                    l183.9,183.9L109.3,430c-5.1,5.1-7.9,11.8-7.9,19c0,7.2,2.8,14,7.9,19l16.1,16.1c5.1,5.1,11.8,7.9,19,7.9s14-2.8,19-7.9L382.7,265
                    c5.1-5.1,7.9-11.9,7.8-19.1C390.5,238.7,387.8,231.9,382.7,226.8z"
          />
        </g>
      </svg>
    </mdui-button-icon>
  </div>
);
