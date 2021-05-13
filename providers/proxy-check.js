const { dialog } = require("electron");

module.exports = (app, address) => {
    return new Promise(resolve => {

        const proxyError = () => {    
            app.once("browser-window-focus", (_event, win) => {
                dialog.showMessageBox(win, {
                    type: "error",
                    title: "Invalid Proxy",
                    message: `Error: Could not connect to Proxy at address "${address}"`,
                    buttons: ["Ok"],
                })
            })
            return resolve(false);
        }

        if (address === "") {
            return resolve(false);
        }

        const lastColonIndex = address.lastIndexOf(":");

        if (lastColonIndex === -1) {
            return proxyError();
        }

        try {
            const req = require('http').request({
                method: 'CONNECT',
                path: 'www.google.com:443',
                timeout: 1000,
                agent: false,
                host: address.slice(0, lastColonIndex),
                port: Number.parseInt(address.slice(lastColonIndex))
            });

            req.on('connect', res => {
                req.destroy();
                if (res.statusCode === 200) {
                    return resolve(true);
                } else {
                    return proxyError();
                }
            });
            req.on('timeout', () => {
                req.destroy();
                return proxyError();
            });
            req.on('error', () => {
                req.destroy();
                return proxyError();
            });
            req.end();
        } catch (error) {
            req?.destroy();
            return proxyError();
        }
    });
}

