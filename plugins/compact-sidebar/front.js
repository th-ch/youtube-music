module.exports = () => {
	const compactSidebar = document.querySelector("#mini-guide");
	const isCompactSidebarDisabled =
		compactSidebar === null ||
		window.getComputedStyle(compactSidebar).display === "none";

	if (isCompactSidebarDisabled) {
		document.querySelector("#button").click();
	}
};
