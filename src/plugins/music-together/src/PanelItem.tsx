import { JSX } from 'solid-js';

import { css } from 'solid-styled-components';

import { cacheNoArgs } from '@/providers/decorators';

const itemStyle = cacheNoArgs(
  () => css`
    display: flex;
    height: 48px;
    align-items: center;
    padding: 0 8px;
    --iron-icon-fill-color: #fff;

    &:not([is-disabled]) {
      cursor: pointer;
    }
    &:hover {
      background-color: var(
        --ytmusic-menu-item-hover-background-color,
        rgba(255, 255, 255, 0.05)
      );
    }
  `,
);

export type PanelItemProps = {
  icon: JSX.Element;
  text: string;
  onClick?: () => void;
};
export const PanelItem = (props: PanelItemProps) => {
  return (
    <div class={`style-scope ${itemStyle()}`} onClick={props.onClick}>
      <div class="icon style-scope ytmusic-menu-service-item-renderer">
        {props.icon}
      </div>
      <div class="text style-scope ytmusic-menu-service-item-renderer">
        {props.text}
      </div>
    </div>
  );
};
