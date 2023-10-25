import config from './config';

import { MenuTemplate } from '../../menu';

const interpolationTimeList = [0, 500, 1000, 1500, 2000, 3000, 4000, 5000];
const qualityList = [10, 25, 50, 100, 200, 500, 1000];
const sizeList = [100, 110, 125, 150, 175, 200, 300];
const bufferList = [1, 5, 10, 20, 30];
const blurAmountList = [0, 5, 10, 25, 50, 100, 150, 200, 500];
const opacityList = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

export default (): MenuTemplate => [
  {
    label: 'Smoothness transition',
    submenu: interpolationTimeList.map((interpolationTime) => ({
      label: `During ${interpolationTime / 1000}s`,
      type: 'radio',
      checked: config.get('interpolationTime') === interpolationTime,
      click() {
        config.set('interpolationTime', interpolationTime);
      },
    })),
  },
  {
    label: 'Quality',
    submenu: qualityList.map((quality) => ({
      label: `${quality} pixels`,
      type: 'radio',
      checked: config.get('quality') === quality,
      click() {
        config.set('quality', quality);
      },
    })),
  },
  {
    label: 'Size',
    submenu: sizeList.map((size) => ({
      label: `${size}%`,
      type: 'radio',
      checked: config.get('size') === size,
      click() {
        config.set('size', size);
      },
    })),
  },
  {
    label: 'Buffer',
    submenu: bufferList.map((buffer) => ({
      label: `${buffer}`,
      type: 'radio',
      checked: config.get('buffer') === buffer,
      click() {
        config.set('buffer', buffer);
      },
    })),
  },
  {
    label: 'Opacity',
    submenu: opacityList.map((opacity) => ({
      label: `${opacity * 100}%`,
      type: 'radio',
      checked: config.get('opacity') === opacity,
      click() {
        config.set('opacity', opacity);
      },
    })),
  },
  {
    label: 'Blur amount',
    submenu: blurAmountList.map((blur) => ({
      label: `${blur} pixels`,
      type: 'radio',
      checked: config.get('blur') === blur,
      click() {
        config.set('blur', blur);
      },
    })),
  },
  {
    label: 'Using fullscreen',
    type: 'checkbox',
    checked: config.get('fullscreen'),
    click(item) {
      config.set('fullscreen', item.checked);
    },
  },
];
