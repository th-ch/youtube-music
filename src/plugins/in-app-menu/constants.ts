export interface InAppMenuConfig {
  enabled: boolean;
  hideDOMWindowControls: boolean;
}
export const defaultInAppMenuConfig: InAppMenuConfig = {
  enabled:
    (
      !window?.navigator?.userAgent?.includes('mac') ||
      global?.process?.platform !== 'darwin'
    ) && (
      !window?.navigator?.userAgent?.includes('linux') ||
      global?.process?.platform !== 'linux'
    ),
  hideDOMWindowControls: false,
};
