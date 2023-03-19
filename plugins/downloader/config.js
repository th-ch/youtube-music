const { PluginConfig } = require('../../config/dynamic');
const config = new PluginConfig('downloader');
module.exports = { ...config };
