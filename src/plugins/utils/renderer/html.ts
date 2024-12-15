import { defaultTrustedTypePolicy } from '@/utils/trusted-types';

/**
 * Creates a DOM element from an HTML string
 * @param html The HTML string
 * @returns The DOM element
 */
export const ElementFromHtml = (html: string): HTMLElement => {
  const template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  (template.innerHTML as string | TrustedHTML) = defaultTrustedTypePolicy
    ? defaultTrustedTypePolicy.createHTML(html)
    : html;

  return template.content.firstElementChild as HTMLElement;
};

/**
 * Creates a DOM element from a src string
 * @param src The source of the image
 * @returns The image element
 */
export const ImageElementFromSrc = (src: string): HTMLImageElement => {
  const image = document.createElement('img');
  image.src = src;
  return image;
};
