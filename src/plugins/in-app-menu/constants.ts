export interface InAppMenuConfig {
  enabled: boolean;
  hideDOMWindowControls: boolean;
}
export const defaultInAppMenuConfig: InAppMenuConfig = {
  enabled:
    (typeof window !== 'undefined' &&
      !window.navigator?.userAgent?.includes('mac')) ||
    (typeof global !== 'undefined' && global.process?.platform !== 'darwin'),
  hideDOMWindowControls: false,
};
