// Segments are an array [ [start, end], … ]
module.exports.sortSegments = (segments) => {
	segments.sort((segment1, segment2) =>
		segment1[0] === segment2[0]
			? segment1[1] - segment2[1]
			: segment1[0] - segment2[0]
	);

	const compiledSegments = [];
	let currentSegment;

	segments.forEach((segment) => {
		if (!currentSegment) {
			currentSegment = segment;
			return;
		}

		if (currentSegment[1] < segment[0]) {
			compiledSegments.push(currentSegment);
			currentSegment = segment;
			return;
		}

		currentSegment[1] = Math.max(currentSegment[1], segment[1]);
	});
	compiledSegments.push(currentSegment);

	return compiledSegments;
};
