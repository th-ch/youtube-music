import { popularFonts } from './types';

import prompt from 'custom-electron-prompt';
import promptOptions from '@/providers/prompt-options';

import type { MenuItemConstructorOptions } from 'electron';

import type { MenuContext } from '@/types/contexts';

import type { FontCustomizerConfig } from './types';

const toRadio = (
  current: string,
  label: string,
  click: (value: string) => void,
): MenuItemConstructorOptions => ({
  label,
  type: 'radio',
  checked: current === label,
  click: () => click(label),
});

export const menu = async ({
  getConfig,
  setConfig,
  window,
  refresh,
}: MenuContext<FontCustomizerConfig>): Promise<
  MenuItemConstructorOptions[]
> => {
  const cfg = await getConfig();

  const allFonts = [...new Set([
    'System Default',
    ...popularFonts.filter((f) => f !== 'System Default'),
    ...(cfg.customFonts || []),
  ])];

  const section = (
    title: string,
    current: string,
    onPick: (value: string) => void,
  ): MenuItemConstructorOptions => ({
    label: title,
    submenu: allFonts.map((f) => toRadio(current, f, onPick)),
  });

  const createFontPicker = (
    label: string,
    fontType: keyof FontCustomizerConfig,
  ): MenuItemConstructorOptions => ({
    label,
    type: 'normal',
    enabled: cfg.enabled,
    click: async () => {
      const currentConfig = await getConfig();
      const newFont = await prompt(
        {
          title: `${label.replace('Pick ', '').replace('…', '')}`,
          label: 'Enter a Google Font family name:',
          type: 'input',
          value: currentConfig[fontType] as string,
          ...promptOptions(),
        },
        window!,
      );

      if (newFont && newFont.trim()) {
        const trimmedFont = newFont.trim();
        const customFonts = currentConfig.customFonts || [];
        const isNew = !popularFonts.includes(trimmedFont) && !customFonts.includes(trimmedFont);
        
        const newConfig: Partial<FontCustomizerConfig> = { [fontType]: trimmedFont };
        if (isNew) {
          newConfig.customFonts = [...customFonts, trimmedFont];
        }

        await setConfig(newConfig);
        refresh?.();
      }
    },
  });

  return [
    {
      label: 'Mode',
      submenu: [
        {
          label: 'Simple (Global)',
          type: 'radio',
          checked: cfg.mode === 'simple',
          click: async () => {
            await setConfig({ mode: 'simple' });
            try { window?.webContents.send('close-all-in-app-menu-panel'); } catch {}
            setTimeout(() => refresh?.(), 100);
          },
        },
        {
          label: 'Advanced (Per section)',
          type: 'radio',
          checked: cfg.mode === 'advanced',
          click: async () => {
            await setConfig({ mode: 'advanced' });
            try { window?.webContents.send('close-all-in-app-menu-panel'); } catch {}
            setTimeout(() => refresh?.(), 100);
          },
        },
      ],
    },
    { type: 'separator' },
    // Simple mode
    {
      ...createFontPicker('Pick global font…', 'globalFont'),
      visible: cfg.mode === 'simple',
    },
    {
      ...section('Global font', cfg.globalFont, (value) => setConfig({ globalFont: value })),
      visible: cfg.mode === 'simple',
    },
    // Advanced mode
    {
      ...createFontPicker('Pick primary UI font…', 'primaryFont'),
      visible: cfg.mode === 'advanced',
    },
    {
      ...section('Primary UI font', cfg.primaryFont, (value) => setConfig({ primaryFont: value })),
      visible: cfg.mode === 'advanced',
    },
    {
      ...createFontPicker('Pick header font…', 'headerFont'),
      visible: cfg.mode === 'advanced',
    },
    {
      ...section('Header font', cfg.headerFont, (value) => setConfig({ headerFont: value })),
      visible: cfg.mode === 'advanced',
    },
    {
      ...createFontPicker('Pick title font…', 'titleFont'),
      visible: cfg.mode === 'advanced',
    },
    {
      ...section('Title font', cfg.titleFont, (value) => setConfig({ titleFont: value })),
      visible: cfg.mode === 'advanced',
    },
    {
      ...createFontPicker('Pick artist font…', 'artistFont'),
      visible: cfg.mode === 'advanced',
    },
    {
      ...section('Artist font', cfg.artistFont, (value) => setConfig({ artistFont: value })),
      visible: cfg.mode === 'advanced',
    },
    {
      ...createFontPicker('Pick lyrics font…', 'lyricsFont'),
      visible: cfg.mode === 'advanced',
    },
    {
      ...section('Lyrics font', cfg.lyricsFont, (value) => setConfig({ lyricsFont: value })),
      visible: cfg.mode === 'advanced',
    },
    {
      ...createFontPicker('Pick menu font…', 'menuFont'),
      visible: cfg.mode === 'advanced',
    },
    {
      ...section('Menu font', cfg.menuFont, (value) => setConfig({ menuFont: value })),
      visible: cfg.mode === 'advanced',
    },
  ];
};