const fs = require("fs");
const { ipcRenderer } = require("electron");

let promptId = null;
let promptOptions = null;

function $(selector) { return document.querySelector(selector) }

document.addEventListener('DOMContentLoaded', promptRegister);

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
		dataElement.style.width = "unset";
		dataElement.style["text-align"] = "center";
		//dataElement.style["min-height"] = "1.5em";
		dataContainerElement.append(createMinus(dataElement));
		dataContainerElement.append(dataElement);
		dataContainerElement.append(createPlus(dataElement));
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
		promptError("An error has occured on the prompt window: \n" + JSON.stringify(error, ["message", "arguments", "type", "name"])
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

function createMinus(dataElement) {
	const minus = document.createElement("span");
	minus.textContent = "-";
	minus.classList.add("minus");
	minus.onmousedown = () => {
		dataElement.value = validateCounterInput(parseInt(dataElement.value) - 1);
	};
	return minus;
}

function createPlus(dataElement) {
	const plus = document.createElement("span");
	plus.textContent = "+";
	plus.classList.add("plus");
	plus.onmousedown = () => {
		dataElement.value = validateCounterInput(parseInt(dataElement.value) + 1);
	};
	return plus;
}

//validate counter
function validateCounterInput(input) {
	const min = promptOptions.counterOptions?.minimum,
		max = promptOptions.counterOptions?.maximum;
	if (min !== undefined && input < min) {
		return min;
	}
	if (max !== undefined && input > max) {
		return max;
	}
	return input;
}
