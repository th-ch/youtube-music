const fs = require("fs");
const { ipcRenderer } = require("electron");
let promptId = null;
let promptOptions = null;
let dataElement = null;

function $(selector) { return document.querySelector(selector); } 

document.addEventListener("DOMContentLoaded", promptRegister);

function promptRegister() {

	//get custom session id
	promptId = document.location.hash.replace("#", "");

	//get options from back
	try {
		promptOptions = JSON.parse(ipcRenderer.sendSync("prompt-get-options:" + promptId));
	} catch (error) {
		return promptError(error);
	}

	//set label
	if (promptOptions.useHtmlLabel) {
		$("#label").innerHTML = promptOptions.label;
	} else {
		$("#label").textContent = promptOptions.label;
	}

	//set button label
	if (promptOptions.buttonLabels && promptOptions.buttonLabels.ok) {
		$("#ok").textContent = promptOptions.buttonLabels.ok;
	}

	if (promptOptions.buttonLabels && promptOptions.buttonLabels.cancel) {
		$("#cancel").textContent = promptOptions.buttonLabels.cancel;
	}

	//inject custom stylesheet from options
	if (promptOptions.customStylesheet) {
		try {
			const customStyleContent = fs.readFileSync(promptOptions.customStylesheet);
			if (customStyleContent) {
				const customStyle = document.createElement("style");
				customStyle.setAttribute("rel", "stylesheet");
				customStyle.append(document.createTextNode(customStyleContent));
				document.head.append(customStyle);
			}
		} catch (error) {
			return promptError(error);
		}
	}

	//add button listeners
	$("#form").addEventListener("submit", promptSubmit);
	$("#cancel").addEventListener("click", promptCancel);

	//create input/select/counter/keybind
	const dataContainerElement = $("#data-container");

	switch (promptOptions.type) {
		case "counter":
			dataElement = promptCreateCounter(dataContainerElement);
			break;
		case "input":
			dataElement = promptCreateInput();
			break;
		case "select":
			dataElement = promptCreateSelect();
			break;
		case "keybind":
			dataElement = require("./keybind")(promptOptions.keybindOptions, dataContainerElement);
			break;
		default:
			return promptError(`Unhandled input type '${promptOptions.type}'`);
	}

	if (promptOptions.type != "keybind") {
		dataElement.setAttribute("id", "data");

		if (promptOptions.type !== "counter") {
			dataContainerElement.append(dataElement);
		}
	}

	dataElement.focus();

	if (promptOptions.type !== "select" && promptOptions.type !== "keybind") {
		dataElement.select();
	}

	//load custom script from options
	if (promptOptions.customScript) {
		try {
			const customScript = require(promptOptions.customScript);
			customScript();
		} catch (error) {
			return promptError(error);
		}
	}
}

window.addEventListener("error", event => {
	if (promptId) {
		promptError("An error has occured on the prompt window: \n" +
			`Message: ${event.message}\nURL: ${event.url}\nLine: ${event.lineNo}, Column: ${event.columnNo}\nStack: ${event.error.stack}`
		);
	}
});

//send error to back
function promptError(error) {
	if (error instanceof Error) {
		error = error.message + "\n" + error.stack;
	}

	ipcRenderer.sendSync("prompt-error:" + promptId, error);
}

//send to back: input=null
function promptCancel() {
	ipcRenderer.sendSync("prompt-post-data:" + promptId, null);
}

//transfer input data to back
function promptSubmit() {
	let data = null;

	switch (promptOptions.type) {
		case "input":
		case "select":
			data = dataElement.value;
			break;
		case "counter":
			data = validateCounterInput(dataElement.value);
			break;
		case "keybind":
			data = dataElement.submit();
			break;
		default: //will never happen
			return promptError(`Unhandled input type '${promptOptions.type}'`);
	}

	ipcRenderer.sendSync("prompt-post-data:" + promptId, data);
}

//creates input box
function promptCreateInput() {
	const dataElement = document.createElement("input");
	dataElement.setAttribute("type", "text");

	if (promptOptions.value) {
		dataElement.value = promptOptions.value;
	} else {
		dataElement.value = "";
	}

	//insert custom input attributes if in options
	if (promptOptions.inputAttrs && typeof (promptOptions.inputAttrs) === "object") {
		for (const k in promptOptions.inputAttrs) {
			if (!Object.prototype.hasOwnProperty.call(promptOptions.inputAttrs, k)) {
				continue;
			}

			dataElement.setAttribute(k, promptOptions.inputAttrs[k]);
		}
	}

	//Cancel/Exit on 'Escape'
	dataElement.addEventListener("keyup", event => {
		if (event.key === "Escape") {
			promptCancel();
		}
	});

	//Confirm on 'Enter'
	dataElement.addEventListener("keypress", event => {
		if (event.key === "Enter") {
			event.preventDefault();
			$("#ok").click();
		}
	});

	return dataElement;
}

//create multiple select
function promptCreateSelect() {
	const dataElement = document.createElement("select");
	let optionElement;

	for (const k in promptOptions.selectOptions) {
		if (!Object.prototype.hasOwnProperty.call(promptOptions.selectOptions, k)) {
			continue;
		}

		optionElement = document.createElement("option");
		optionElement.setAttribute("value", k);
		optionElement.textContent = promptOptions.selectOptions[k];
		if (k === promptOptions.value) {
			optionElement.setAttribute("selected", "selected");
		}

		dataElement.append(optionElement);
	}

	return dataElement;
}

function promptCreateCounter(parentElement) {
	if (promptOptions.counterOptions?.multiFire) {
		document.onmouseup = () => {
			if (nextTimeoutID) {
				clearTimeout(nextTimeoutID)
				nextTimeoutID = null;
			}
		};
	}

	promptOptions.value = validateCounterInput(promptOptions.value);

	const dataElement = promptCreateInput();
	dataElement.onkeypress = function isNumberKey(e) {
		if (Number.isNaN(parseInt(e.key)) && e.key !== "Backspace" && e.key !== "Delete")
			return false;
		return true;
	}

	dataElement.style.width = "unset";
	dataElement.style["text-align"] = "center";

	parentElement.append(createMinusButton(dataElement));
	parentElement.append(dataElement);
	parentElement.append(createPlusButton(dataElement));

	return dataElement;
}

let nextTimeoutID = null;

/** Function execute callback in 3 accelerated intervals based on timer.
 * Terminated from document.onmouseup() that is registered from promptCreateCounter()
 * @param {function} callback function to execute
 * @param {object} timer {
 *	* 	time: First delay in miliseconds
 *	* 	scaleSpeed: Speed change per tick on first acceleration
 *	* 	limit: First Speed Limit, gets divided by 2 after $20 calls. $number change exponentially
 * }
 * @param {int} stepArgs argument for callback representing Initial steps per click, default to 1
 *  steps starts to increase when speed is too fast to notice
 * @param {int} counter used internally to decrease timer.limit
 */
function multiFire(callback, timer = { time: 300, scaleSpeed: 100, limit: 100 }, stepsArg = 1, counter = 0) {
	callback(stepsArg);

	const nextTimeout = timer.time;

	if (counter > 20) {
		counter = 0 - stepsArg;
		if (timer.limit > 1) {
			timer.limit /= 2;
		} else {
			stepsArg *= 2;
		}
	}

	if (timer.time !== timer.limit) {
		timer.time = Math.max(timer.time - timer.scaleSpeed, timer.limit)
	}

	nextTimeoutID = setTimeout(
		multiFire, //callback
		nextTimeout, //timer
		//multiFire args:
		callback,
		timer,
		stepsArg,
		counter + 1
	);
}

function createMinusButton(dataElement) {
	function doMinus(steps) {
		dataElement.value = validateCounterInput(parseInt(dataElement.value) - steps);
	}

	const minusBtn = document.createElement("span");
	minusBtn.textContent = "-";
	minusBtn.classList.add("minus");

	if (promptOptions.counterOptions?.multiFire) {
		minusBtn.onmousedown = () => {
			multiFire(doMinus);
		};
	} else {
		minusBtn.onmousedown = () => {
			doMinus();
		};
	}

	return minusBtn;
}

function createPlusButton(dataElement) {
	function doPlus(steps) {
		dataElement.value = validateCounterInput(parseInt(dataElement.value) + steps);
	}

	const plusBtn = document.createElement("span");
	plusBtn.textContent = "+";
	plusBtn.classList.add("plus");

	if (promptOptions.counterOptions?.multiFire) {
		plusBtn.onmousedown = () => {
			multiFire(doPlus);
		};
	} else {
		plusBtn.onmousedown = () => {
			doPlus();
		};
	}

	return plusBtn;
}

//validate counter
function validateCounterInput(input) {

	const min = promptOptions.counterOptions?.minimum;
	const max = promptOptions.counterOptions?.maximum;
	//note that !min/max would proc if min/max are 0
	if (min !== null && min !== undefined && input < min) {
		return min;
	}

	if (max !== null && max !== undefined && input > max) {
		return max;
	}

	return input;
}

module.exports.promptError = promptError;

