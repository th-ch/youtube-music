const { ipcRenderer } = require("electron");

// Override specific listeners of volume-slider by modifying Element.prototype
function overrideAddEventListener(){
    // Events to ignore
    const nativeEvents = ["mousewheel", "keydown", "keyup"];
    // Save native addEventListener
	Element.prototype._addEventListener = Element.prototype.addEventListener;

	Element.prototype.addEventListener = function(type,listener,useCapture=false) {
        if(this.tagName === "TP-YT-PAPER-SLIDER") { //tagName of #volume-slider
            for (const eventType of nativeEvents) {
                if (eventType === type) {
                    return;
                }
            }
        } //else
		this._addEventListener(type,listener,useCapture);
    };
}

module.exports = () => {
    overrideAddEventListener();
    // Restore the listeners after load to avoid keeping Element.prototype altered
    ipcRenderer.once("restoreAddEventListener", () => { //called from Main to make sure page is completly loaded
		Element.prototype.addEventListener = Element.prototype._addEventListener;
	});
}
