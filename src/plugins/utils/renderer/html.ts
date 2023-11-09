// Creates a DOM element from an HTML string
export const ElementFromHtml = (html: string): HTMLElement => {
  const template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;

  return template.content.firstElementChild as HTMLElement;
};
