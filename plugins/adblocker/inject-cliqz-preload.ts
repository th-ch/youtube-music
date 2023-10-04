export default () => {
  const path = require.resolve('@cliqz/adblocker-electron-preload'); // prevent require hoisting
  require(path);
};
