import builder from './index';

export default builder.createRenderer(() => {
  const getCompactSidebar = () => document.querySelector('#mini-guide');
  const isCompactSidebarDisabled = () => {
    const compactSidebar = getCompactSidebar();
    return compactSidebar === null || window.getComputedStyle(compactSidebar).display === 'none';
  };

  return {
    onLoad() {
      if (isCompactSidebarDisabled()) {
        document.querySelector<HTMLButtonElement>('#button')?.click();
      }
    },
    onUnload() {
      if (!isCompactSidebarDisabled()) {
        document.querySelector<HTMLButtonElement>('#button')?.click();
      }
    },
    onConfigChange() {
      if (isCompactSidebarDisabled()) {
        document.querySelector<HTMLButtonElement>('#button')?.click();
      }
    }
  };
});
