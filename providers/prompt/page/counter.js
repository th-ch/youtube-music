const { promptCreateInput } = require("./prompt");

module.exports = { promptCreateCounter , validateCounterInput }

let options;


function promptCreateCounter(promptOptions, parentElement) {
    options = promptOptions;
	if (options.counterOptions?.multiFire) {
		document.onmouseup = () => {
			if (nextTimeoutID) {
				clearTimeout(nextTimeoutID)
				nextTimeoutID = null;
			}
		};
	}

	options.value = validateCounterInput(options.value);

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

	if (options.counterOptions?.multiFire) {
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

	if (options.counterOptions?.multiFire) {
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

	const min = options.counterOptions?.minimum;
	const max = options.counterOptions?.maximum;
	//note that !min/max would proc if min/max are 0
	if (min !== null && min !== undefined && input < min) {
		return min;
	}

	if (max !== null && max !== undefined && input > max) {
		return max;
	}

	return input;
}
