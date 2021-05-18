/*
This is used to determine if plugin is actually active
(not if its only enabled in options)
*/
let enabled = false;

module.exports = () => enabled = true;

module.exports.enabled = () => enabled;
