export default () => {
  const compactSidebar = document.querySelector('#mini-guide');
  const isCompactSidebarDisabled
    = compactSidebar === null
    || window.getComputedStyle(compactSidebar).display === 'none';

  if (isCompactSidebarDisabled) {
    document.querySelector<HTMLButtonElement>('#button')?.click();
  }
};
