const { PluginConfig } = require("../../config/dynamic");
const config = new PluginConfig("crossfade", { enableFront: true });
module.exports = { ...config };
