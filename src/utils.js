export const parseDate = str =>
	typeof str === "string" ? Date.parse(`${str}Z`) : null

export const formatTime = seconds => {
	const h = Math.floor(seconds / 3600)
	const m = Math.floor((seconds % 3600) / 60)
	const s = seconds % 60
	return [h, m, s].map(i => `${i}`.padStart(2, "0")).join(":")
}

export const getTimeSpent = (trackerDuration, now) => {
	let len = 0
	for (let { start, end } of trackerDuration) {
		const startVal = parseDate(start)
		const endVal = parseDate(end) || now

		if (startVal === null) continue
		len += endVal - startVal
	}

	return formatTime(Math.floor(len / 1000))
}

export const centerText = (text, width) => {
	let rightPad = Math.floor((width - text.length) / 2)
	let leftPad = width - Math.min(width, text.length + rightPad)

	return [" ".repeat(leftPad), text, " ".repeat(rightPad)].join("")
}