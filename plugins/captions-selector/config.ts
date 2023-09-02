import { PluginConfig } from '../../config/dynamic';

const config = new PluginConfig('captions-selector', { enableFront: true });
export default { ...config } as PluginConfig<'captions-selector'>;
