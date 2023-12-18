import { ElementFromHtml } from '@/plugins/utils/renderer';

import itemHTML from './templates/item.html?raw';
import popupHTML from './templates/popup.html?raw';

type Placement = 'top' | 'bottom' | 'right' | 'left' | 'center' | 'middle' | 'center-middle' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type PopupProps = {
  data: ItemRendererProps[];
  anchorAt?: Placement;
  popupAt?: Placement;
}
export const Popup = (props: PopupProps) => {
  const popup = ElementFromHtml(popupHTML);
  const container = popup.querySelector<HTMLElement>('.music-together-popup-container')!;
  const items = props.data.map((props) => ItemRenderer(props));

  container.append(...items.map(({ element }) => element));
  popup.style.setProperty('opacity', '0');
  popup.style.setProperty('pointer-events', 'none');

  document.body.append(popup);

  return {
    element: popup,
    container,
    items,

    show(x: number, y: number, anchor?: HTMLElement) {
      let left = x;
      let top = y;

      if (anchor) {
        if (props.anchorAt?.includes('right')) left += anchor.clientWidth;
        if (props.anchorAt?.includes('bottom')) top += anchor.clientHeight;
        if (props.anchorAt?.includes('center')) left += anchor.clientWidth / 2;
        if (props.anchorAt?.includes('middle')) top += anchor.clientHeight / 2;
      }

      if (props.popupAt?.includes('right')) left -= popup.clientWidth;
      if (props.popupAt?.includes('bottom')) top -= popup.clientHeight;
      if (props.popupAt?.includes('center')) left -= popup.clientWidth / 2;
      if (props.popupAt?.includes('middle')) top -= popup.clientHeight / 2;

      popup.style.setProperty('left', `${left}px`);
      popup.style.setProperty('top', `${top}px`);
      popup.style.setProperty('opacity', '1');
      popup.style.setProperty('pointer-events', 'unset');
    },
    showAtAnchor(anchor: HTMLElement) {
      const { x, y } = anchor.getBoundingClientRect();
      this.show(x, y, anchor);
    },

    isShowing() {
      return popup.style.getPropertyValue('opacity') === '1';
    },

    dismiss() {
      popup.style.setProperty('opacity', '0');
      popup.style.setProperty('pointer-events', 'none');
    },
  };
};

type ItemRendererProps = {
  icon?: Element;
  text: string;
  onClick?: () => void;
};
export const ItemRenderer = (props: ItemRendererProps) => {
  const element = ElementFromHtml(itemHTML);
  const iconContainer = element.querySelector<HTMLElement>('div.icon')!;
  const textContainer = element.querySelector<HTMLElement>('div.text')!;
  if (props.icon) iconContainer.appendChild(props.icon);
  textContainer.append(props.text);

  if (props.onClick) {
    element.addEventListener('click', () => {
      props.onClick?.();
    });
  }

  return {
    element,
    setIcon(icon: Element) {
      iconContainer.replaceChildren(icon);
    },
    setText(text: string) {
      textContainer.replaceChildren(text);
    },
  };
};
