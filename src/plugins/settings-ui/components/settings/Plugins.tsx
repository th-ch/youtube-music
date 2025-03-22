export default () => {
  return (
    <div class="ytmd-sui-settingsContent">
      <div class="ytmd-sui-settingItem">
        <div class="ytmd-sui-pluginCard">
          <div class="ytmd-sui-pluginHeader">
            <div>
              <h4>Code Formatter</h4>
              <span class="ytmd-sui-pluginAuthor">by John Doe</span>
            </div>
            <div class="ytmd-sui-toggle">
              <div class="ytmd-sui-toggleHandle"></div>
            </div>
          </div>
          <p class="ytmd-sui-pluginDescription">
            Automatically format your code using industry standard rules
          </p>
        </div>
      </div>

      <div class="ytmd-sui-settingItem">
        <div class="ytmd-sui-pluginCard">
          <div class="ytmd-sui-pluginHeader">
            <div>
              <h4>Auto-Complete</h4>
              <span class="ytmd-sui-pluginAuthor">by Jane Smith</span>
            </div>
            <div class="ytmd-sui-toggle">
              <div class="ytmd-sui-toggleHandle"></div>
            </div>
          </div>
          <p class="ytmd-sui-pluginDescription">
            Smart code completion based on context and usage patterns
          </p>
        </div>
      </div>

      <button class="ytmd-sui-addButton">
        <span>+</span> Add Plugin
      </button>
    </div>
  );
};
