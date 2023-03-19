const { PluginConfig } = require("../../config/dynamic");

const config = new PluginConfig("notifications");

module.exports = { ...config };
