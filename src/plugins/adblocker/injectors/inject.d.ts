import type { ContextBridge } from 'electron';

/**
 * Injects the adblocker script into the context bridge.
 * @param contextBridge - The Electron context bridge.
 */
export const inject: (contextBridge: ContextBridge) => void;

/**
 * Checks if the adblocker script has been injected.
 * @returns A boolean indicating whether the script has been injected.
 */
export const isInjected: () => boolean;
