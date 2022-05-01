const is = require("electron-is");

let ignored = {
    id: ["volume-slider", "expand-volume-slider"],
    types: ["mousewheel", "keydown", "keyup"]
};

function overrideAddEventListener() {
    // Save native addEventListener
    Element.prototype._addEventListener = Element.prototype.addEventListener;
    // Override addEventListener to Ignore specific events in volume-slider
    Element.prototype.addEventListener = function (type, listener, useCapture = false) {
        if (!(
            ignored.id.includes(this.id) &&
            ignored.types.includes(type)
        )) {
            this._addEventListener(type, listener, useCapture);
        } else if (is.dev()) {
            console.log(`Ignoring event: "${this.id}.${type}()"`);
        }
    };
}

module.exports = () => {
    overrideAddEventListener();
    // Restore original function after finished loading to avoid keeping Element.prototype altered
    window.addEventListener('load', () => {
        Element.prototype.addEventListener = Element.prototype._addEventListener;
        Element.prototype._addEventListener = undefined;
        ignored = undefined;
    }, { once: true });
};
