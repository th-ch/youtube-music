import { createPlugin } from '@/utils';

export default createPlugin<
  unknown,
  unknown,
  {
    getCompactSidebar: () => HTMLElement | null;
    isCompactSidebarDisabled: () => boolean;
  }
>({
  name: 'Compact Sidebar',
  description: 'Always set the sidebar in compact mode',
  restartNeeded: false,
  config: {
    enabled: false,
  },
  renderer: {
    getCompactSidebar: () => document.querySelector('#mini-guide'),
    isCompactSidebarDisabled() {
      const compactSidebar = this.getCompactSidebar();
      return (
        compactSidebar === null ||
        window.getComputedStyle(compactSidebar).display === 'none'
      );
    },
    start() {
      if (this.isCompactSidebarDisabled()) {
        document.querySelector<HTMLButtonElement>('#button')?.click();
      }
    },
    stop() {
      if (this.isCompactSidebarDisabled()) {
        document.querySelector<HTMLButtonElement>('#button')?.click();
      }
    },
    onConfigChange() {
      if (this.isCompactSidebarDisabled()) {
        document.querySelector<HTMLButtonElement>('#button')?.click();
      }
    },
  },
});
