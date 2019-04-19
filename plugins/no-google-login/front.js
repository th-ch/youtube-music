function removeLoginElements() {
	const elementsToRemove = [
		".sign-in-link.ytmusic-nav-bar",
		'.ytmusic-pivot-bar-renderer[tab-id="FEmusic_liked"]'
	];

	elementsToRemove.forEach(selector => {
		const node = document.querySelector(selector);
		if (node) {
			node.remove();
		}
	});
}

module.exports = removeLoginElements;
