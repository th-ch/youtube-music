const { PluginConfig } = require("../../config/dynamic");
const config = new PluginConfig("captions-selector", { enableFront: true });
module.exports = { ...config };
