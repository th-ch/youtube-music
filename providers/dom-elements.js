let domElements = {};

const watchDOMElement = (name, selectorFn, cb) => {
	const observer = new MutationObserver((mutations, observer) => {
		if (!domElements[name]) {
			domElements[name] = selectorFn(document);
		}

		if (domElements[name]) {
			cb(domElements[name]);
		}
	});

	observer.observe(document, {
		childList: true,
		subtree: true,
	});
};

module.exports = { watchDOMElement };
