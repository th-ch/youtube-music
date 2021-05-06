const { ipcRenderer } = require("electron");

function overrideAddEventListener() {
    // Save native addEventListener
    Element.prototype._addEventListener = Element.prototype.addEventListener;
    // Override addEventListener to Ignore specific events in volume-slider
    Element.prototype.addEventListener = function (type, listener, useCapture = false) {
        if (!(
            ["volume-slider", "expand-volume-slider"].includes(this.id) &&
            ["mousewheel", "keydown", "keyup"].includes(type)
        )) {
            this._addEventListener(type, listener, useCapture);
        }
    };
}

module.exports = () => {
    overrideAddEventListener();
    // Restore original function after did-finish-load to avoid keeping Element.prototype altered
    ipcRenderer.once("restoreAddEventListener", () => { //called from Main to make sure page is completly loaded
        Element.prototype.addEventListener = Element.prototype._addEventListener;
        Element.prototype._addEventListener = undefined;
    });
};
