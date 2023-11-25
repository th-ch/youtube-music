import { createPlugin } from '@/utils';
import style from './style.css?inline';

export default createPlugin({
  name: 'Blur Navigation Bar',
  renderer: { stylesheet: style },
});
