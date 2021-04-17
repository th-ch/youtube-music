const fs = require("fs");
const { ipcRenderer } = require("electron");

let promptId = null;
let promptOptions = null;

function $(selector) {
	return document.querySelector(selector);
}

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

	//create input/select
	const dataContainerElement = $("#data-container");
	let dataElement;

	switch (promptOptions.type) {
		case "counter":
			dataElement = promptCreateCounter();
			break;
		case "input":
			dataElement = promptCreateInput();
			break;
		case "select":
			dataElement = promptCreateSelect();
			break;
		default:
			return promptError(`Unhandled input type '${promptOptions.type}'`);
	}

	if (promptOptions.type === "counter") {
		dataContainerElement.append(createMinusButton(dataElement));
		dataContainerElement.append(dataElement);
		dataContainerElement.append(createPlusButton(dataElement));
	} else {
		dataContainerElement.append(dataElement);
	}

	dataElement.setAttribute("id", "data");
	dataElement.focus();

	if (promptOptions.type === "input" || promptOptions.type === "counter") {
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

window.addEventListener("error", error => {
	if (promptId) {
		promptError("An error has occured on the prompt window: \n" +
			JSON.stringify(error, ["message", "arguments", "type", "name"])
		);
	}
});

//send error to back
function promptError(error) {
	if (error instanceof Error) {
		error = error.message;
	}

	ipcRenderer.sendSync("prompt-error:" + promptId, error);
}

//send to back: input=null
function promptCancel() {
	ipcRenderer.sendSync("prompt-post-data:" + promptId, null);
}

//transfer input data to back
function promptSubmit() {
	const dataElement = $("#data");
	let data = null;

	switch (promptOptions.type) {
		case "input":
			data = dataElement.value;
			break;
		case "counter":
			data = validateCounterInput(dataElement.value);
			break;
		case "select":
			data = promptOptions.selectMultiple ?
				dataElement.querySelectorAll("option[selected]").map(o => o.getAttribute("value")) :
				dataElement.value;
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
		if (promptOptions.type === "counter") {
			promptOptions.value = validateCounterInput(promptOptions.value);
		}
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

let pressed = false;
function multiFire(timer, scaleSpeed, callback, ...args) {
	if (!pressed) {
		return;
	}
	if (timer > scaleSpeed) {
		timer -= scaleSpeed;
	}
	callback(...args);
	setTimeout(multiFire, timer, timer, scaleSpeed, callback, ...args)
}

function createMinusButton(dataElement) {
	function doMinus() {
		dataElement.value = validateCounterInput(parseInt(dataElement.value) - 1);
	}
	const minusBtn = document.createElement("span");
	minusBtn.textContent = "-";
	minusBtn.classList.add("minus");
	if (promptOptions.counterOptions?.multiFire) {
		minusBtn.onmousedown = () => {
			pressed = true;
			multiFire(500, 100, doMinus);
		};

	} else {
		minusBtn.onmousedown = () => {
			doMinus();
		};
	}
	return minusBtn;
}

function createPlusButton(dataElement) {
	function doPlus() {
		dataElement.value = validateCounterInput(parseInt(dataElement.value) + 1);
	}
	const plusBtn = document.createElement("span");
	plusBtn.textContent = "+";
	plusBtn.classList.add("plus");
	if (promptOptions.counterOptions?.multiFire) {
		plusBtn.onmousedown = () => {
			pressed = true;
			multiFire(500, 100, doPlus);
		};
	} else {
		plusBtn.onmousedown = () => {
			doPlus();
		};
	}
	return plusBtn;
}

function promptCreateCounter() {
	if (promptOptions.counterOptions?.multiFire) {
		document.onmouseup = () => {
			pressed = false;
		};
	}

	const dataElement = promptCreateInput();

	dataElement.style.width = "unset";
	dataElement.style["text-align"] = "center";

	return dataElement;
}

//validate counter
function validateCounterInput(input) {
	const min = promptOptions.counterOptions?.minimum;
	const max = promptOptions.counterOptions?.maximum;

	if (min !== undefined && input < min) {
		return min;
	}

	if (max !== undefined && input > max) {
		return max;
	}

	return input;
}
