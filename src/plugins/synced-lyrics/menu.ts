import { MenuContext } from "@/types/contexts";
import { MenuItemConstructorOptions } from "electron";
import { SyncedLyricsPluginConfig } from ".";

export const menuContent = async ({ getConfig, setConfig }: MenuContext<SyncedLyricsPluginConfig>): Promise<MenuItemConstructorOptions[]> => {
    const config = await getConfig();

    return [
        {
        label: 'Make the lyrics perfectly synced',
        toolTip: 'Calculate to the milisecond the display of the next line (can have a small impact on performance)',
        type: 'checkbox',
        checked: config.preciseTiming,
        click(item) {
            setConfig({
            preciseTiming: item.checked,
            });
        },
        },
        {
        label: 'Show time codes',
        toolTip: 'Show the time codes next to the lyrics',
        type: 'checkbox',
        checked: config.showTimeCodes,
        click(item) {
            setConfig({
            showTimeCodes: item.checked,
            });
        },
        },
        {
        label: 'Show lyrics even if inexact',
        toolTip: 'If the song is not found, the plugin tries again with a different search query.\nThe result from the second attempt may not be exact.',
        type: 'checkbox',
        checked: config.showLyricsEvenIfInexact,
        click(item) {
            setConfig({
            showLyricsEvenIfInexact: item.checked,
            });
        },
        },
        {
        label: 'Line effect',
        toolTip: 'Choose the effect to apply to the current line',
        type: 'submenu',
        submenu: [
            {
            label: 'Scale',
            toolTip: 'Scale the current line',
            type: 'radio',
            checked: config.lineEffect === 'scale',
            click() {
                setConfig({
                lineEffect: 'scale',
                });
            },
            },
            {
            label: 'Offset',
            toolTip: 'Offset on the right the current line',
            type: 'radio',
            checked: config.lineEffect === 'offset',
            click() {
                setConfig({
                lineEffect: 'offset',
                });
            },
            },
            {
            label: 'Focus',
            toolTip: 'Make only the current line white',
            type: 'radio',
            checked: config.lineEffect === 'focus',
            click() {
                setConfig({
                lineEffect: 'focus',
                });
            },
            },
        ],
        },
        {
        label: 'Default character between lyrics',
        toolTip: 'Choose the default string to use for the gap between lyrics',
        type: 'submenu',
        submenu: [
            {
            label: '♪',
            type: 'radio',
            checked: config.defaultTextString === '♪',
            click() {
                setConfig({
                defaultTextString: '♪',
                });
            },
            },
            {
            label: '[SPACE]',
            type: 'radio',
            checked: config.defaultTextString === ' ',
            click() {
                setConfig({
                defaultTextString: ' ',
                });
            },
            },
            {
            label: '...',
            type: 'radio',
            checked: config.defaultTextString === '...',
            click() {
                setConfig({
                defaultTextString: '...',
                });
            },
            },
            {
            label: '———',
            type: 'radio',
            checked: config.defaultTextString === '———',
            click() {
                setConfig({
                defaultTextString: '———',
                });
            },
            },
            {
            label: '[BACKSPACE]',
            type: 'radio',
            checked: config.defaultTextString === '\n',
            click() {
                setConfig({
                defaultTextString: '\n',
                });
            },
            },
        ],
        },
    ];
};