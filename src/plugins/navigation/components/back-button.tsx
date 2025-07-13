export interface BackButtonProps {
  onClick?: (e: MouseEvent) => void;
  title: string;
}

export const BackButton = (props: BackButtonProps) => (
  <div
    class="style-scope ytmusic-pivot-bar-renderer navigation-item"
    role="tab"
    tab-id="FEmusic_back"
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
          <path d="M109.3 265.2l218.9 218.9c5.1 5.1 11.8 7.9 19 7.9s14-2.8 19-7.9l16.1-16.1c10.5-10.5 10.5-27.6 0-38.1L198.6 246.1 382.7 62c5.1-5.1 7.9-11.8 7.9-19 0-7.2-2.8-14-7.9-19L366.5 7.9c-5.1-5.1-11.8-7.9-19-7.9-7.2 0-14 2.8-19 7.9L109.3 227c-5.1 5.1-7.9 11.9-7.8 19.1 0 7.2 2.8 14 7.8 19.1z" />
        </g>
      </svg>
    </mdui-button-icon>
  </div>
);
