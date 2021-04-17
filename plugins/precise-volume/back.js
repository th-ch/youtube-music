/*
this is used to determine if plugin is actually active
(not if its only enabled in options)
*/
let enabled = false;
module.exports = (win,options) => {
    enabled = true;
};

module.exports.enabled = () => {
    return enabled;
};