export default () => {
  const path = '@cliqz/adblocker-electron-preload'; // prevent require hoisting
  require(path);
};
