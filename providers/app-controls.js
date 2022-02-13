const app = require("electron").app || require('@electron/remote').app;

module.exports.restart = () => {
    app.relaunch(); 
 	app.exit(); 
};
