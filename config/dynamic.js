const { ipcRenderer, ipcMain } = require("electron");

const defaultConfig = require("./defaults");
const { getOptions, setOptions, setMenuOptions } = require("./plugins");
const { sendToFront } = require("../providers/app-controls");

const activePlugins = {};
/**
 * [!IMPORTANT!]
 * The method is **sync** in the main process and **async** in the renderer process.
 */
module.exports.getActivePlugins =
	process.type === "renderer"
		? async () => ipcRenderer.invoke("get-active-plugins")
		: () => activePlugins;

if (process.type === "browser") {
	ipcMain.handle("get-active-plugins", this.getActivePlugins);
}

/**
 * [!IMPORTANT!]
 * The method is **sync** in the main process and **async** in the renderer process.
 */
module.exports.isActive =
	process.type === "renderer"
		? async (plugin) =>
				plugin in (await ipcRenderer.invoke("get-active-plugins"))
		: (plugin) => plugin in activePlugins;

/**
 * This class is used to create a dynamic synced config for plugins.
 *
 * [!IMPORTANT!]
 * The methods are **sync** in the main process and **async** in the renderer process.
 *
 * @param {string} name - The name of the plugin.
 * @param {boolean} [options.enableFront] - Whether the config should be available in front.js. Default: false.
 * @param {object} [options.initialOptions] - The initial options for the plugin. Default: loaded from store.
 *
 * @example
 * const { PluginConfig } = require("../../config/dynamic");
 * const config = new PluginConfig("plugin-name", { enableFront: true });
 * module.exports = { ...config };
 *
 * // or
 *
 * module.exports = (win, options) => {
 *  const config = new PluginConfig("plugin-name", {
 *  	enableFront: true,
 *  	initialOptions: options,
 *  });
 *  setupMyPlugin(win, config);
 * };
 */
module.exports.PluginConfig = class PluginConfig {
	#name;
	#config;
	#defaultConfig;
	#enableFront;

	#subscribers = {};
	#allSubscribers = [];

	constructor(name, { enableFront = false, initialOptions = undefined } = {}) {
		const pluginDefaultConfig = defaultConfig.plugins[name] || {};
		const pluginConfig = initialOptions || getOptions(name) || {};

		this.#name = name;
		this.#enableFront = enableFront;
		this.#defaultConfig = pluginDefaultConfig;
		this.#config = { ...pluginDefaultConfig, ...pluginConfig };

		if (this.#enableFront) {
			this.#setupFront();
		}

		activePlugins[name] = this;
	}

	get = (option) => {
		return this.#config[option];
	};

	set = (option, value) => {
		this.#config[option] = value;
		this.#onChange(option);
		this.#save();
	};

	toggle = (option) => {
		this.#config[option] = !this.#config[option];
		this.#onChange(option);
		this.#save();
	};

	getAll = () => {
		return { ...this.#config };
	};

	setAll = (options) => {
		if (!options || typeof options !== "object")
			throw new Error("Options must be an object.");

		let changed = false;
		for (const [key, val] of Object.entries(options)) {
			if (this.#config[key] !== val) {
				this.#config[key] = val;
				this.#onChange(key, false);
				changed = true;
			}
		}
		if (changed) this.#allSubscribers.forEach((fn) => fn(this.#config));
		this.#save();
	};

	getDefaultConfig = () => {
		return this.#defaultConfig;
	};

	/**
	 * Use this method to set an option and restart the app if `appConfig.restartOnConfigChange === true`
	 *
	 * Used for options that require a restart to take effect.
	 */
	setAndMaybeRestart = (option, value) => {
		this.#config[option] = value;
		setMenuOptions(this.#name, this.#config);
		this.#onChange(option);
	};

	subscribe = (valueName, fn) => {
		this.#subscribers[valueName] = fn;
	};

	subscribeAll = (fn) => {
		this.#allSubscribers.push(fn);
	};

	/** Called only from back */
	#save() {
		setOptions(this.#name, this.#config);
	}

	#onChange(valueName, single = true) {
		this.#subscribers[valueName]?.(this.#config[valueName]);
		if (single) this.#allSubscribers.forEach((fn) => fn(this.#config));
	}

	#setupFront() {
		const ignoredMethods = ["subscribe", "subscribeAll"];

		if (process.type === "renderer") {
			for (const [fnName, fn] of Object.entries(this)) {
				if (typeof fn !== "function" || fn.name in ignoredMethods) return;
				this[fnName] = async (...args) => {
					return await ipcRenderer.invoke(
						`${this.#name}-config-${fnName}`,
						...args,
					);
				};

				this.subscribe = (valueName, fn) => {
					if (valueName in this.#subscribers) {
						console.error(`Already subscribed to ${valueName}`);
					}
					this.#subscribers[valueName] = fn;
					ipcRenderer.on(
						`${this.#name}-config-changed-${valueName}`,
						(_, value) => {
							fn(value);
						},
					);
					ipcRenderer.send(`${this.#name}-config-subscribe`, valueName);
				};

				this.subscribeAll = (fn) => {
					ipcRenderer.on(`${this.#name}-config-changed`, (_, value) => {
						fn(value);
					});
					ipcRenderer.send(`${this.#name}-config-subscribe-all`);
				};
			}
		} else if (process.type === "browser") {
			for (const [fnName, fn] of Object.entries(this)) {
				if (typeof fn !== "function" || fn.name in ignoredMethods) return;
				ipcMain.handle(`${this.#name}-config-${fnName}`, (_, ...args) => {
					return fn(...args);
				});
			}

			ipcMain.on(`${this.#name}-config-subscribe`, (_, valueName) => {
				this.subscribe(valueName, (value) => {
					sendToFront(`${this.#name}-config-changed-${valueName}`, value);
				});
			});

			ipcMain.on(`${this.#name}-config-subscribe-all`, () => {
				this.subscribeAll((value) => {
					sendToFront(`${this.#name}-config-changed`, value);
				});
			});
		}
	}
};
