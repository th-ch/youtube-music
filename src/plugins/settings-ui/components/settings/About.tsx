export default () => {
  return (
    <div class="ytmd-sui-settingsContent">
      <div class="ytmd-sui-aboutSection">
        <h3>Application Name</h3>
        <p class="ytmd-sui-version">Version 1.0.0</p>
        <p class="ytmd-sui-description">
          A powerful application built with SolidJS for managing your projects
          efficiently.
        </p>
      </div>

      <div class="ytmd-sui-aboutSection">
        <h4>System Information</h4>
        <div class="ytmd-sui-systemInfo">
          <div class="ytmd-sui-infoRow">
            <span>Platform:</span>
            <span>Web</span>
          </div>
          <div class="ytmd-sui-infoRow">
            <span>Framework:</span>
            <span>SolidJS</span>
          </div>
          <div class="ytmd-sui-infoRow">
            <span>Last Updated:</span>
            <span>March 15, 2024</span>
          </div>
        </div>
      </div>

      <div class="ytmd-sui-aboutSection">
        <button class="ytmd-sui-actionButton">Check for Updates</button>
        <button class="ytmd-sui-actionButton">View Licenses</button>
      </div>
    </div>
  );
};
