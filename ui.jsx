"use strict"
const React = require("react")
const PropTypes = require("prop-types")
const { Text, Color, Box, useInput, useApp } = require("ink")
const fetch = require("node-fetch")

const TOKEN = process.env.AUTH_TOKEN

function useInterval(callback, delay) {
	const savedCallback = React.useRef()

	// Remember the latest callback.
	React.useEffect(() => {
		savedCallback.current = callback
	}, [callback])

	// Set up the interval.
	React.useEffect(() => {
		function tick() {
			savedCallback.current()
		}
		if (delay !== null) {
			let id = setInterval(tick, delay)
			return () => clearInterval(id)
		}
	}, [delay])
}

const parseDate = str =>
	typeof str === "string" ? Date.parse(`${str}Z`) : null

const formatTime = seconds => {
	const h = Math.floor(seconds / 3600)
	const m = Math.floor((seconds % 3600) / 60)
	const s = seconds % 60
	return [h, m, s].map(i => `${i}`.padStart(2, "0")).join(":")
}

const getTimeSpent = trackerDuration => {
	let len = 0
	for (let { start, end } of trackerDuration) {
		const startVal = parseDate(start)
		const endVal = parseDate(end) || Date.now()

		if (startVal === null) continue
		len += endVal - startVal
	}

	return formatTime(Math.floor(len / 1000))
}

async function toggleTracker(id, token = TOKEN) {
	return fetch(`https://api.tempo.io/trackers/v1/${id}/toggle`, {
		method: "PATCH",
		headers: {
			authorization: `Bearer ${token}`
		}
	}).then(a => a.json())
}

async function getTrackers(token = TOKEN) {
	return fetch("https://api.tempo.io/trackers/v1/", {
		method: "GET",
		headers: {
			authorization: `Bearer ${token}`
		}
	}).then(a => a.json())
}

function Tracker({ tracker, selected }) {
	return (
		<Box key={tracker.id}>
			<Box marginRight={1}>{selected ? `[>]` : "[ ]"}</Box>
			<Box
				marginRight={2}
				width={9}
				justifyContent="center"
				alignItems="flex-start"
			>
				<Color keyword={tracker.isPlaying ? "green" : "white"}>
					<Text>{tracker.isPlaying ? "WORKING" : "PAUSED"}</Text>
				</Color>
			</Box>
			<Box
				width={10}
				marginRight={2}
				textWrap="truncate"
				justifyContent="center"
				alignItems="center"
			>
				<Text>{tracker.issueKey || "No Issue"}</Text>
			</Box>
			<Box width={12}>
				<Text>{getTimeSpent(tracker.time.trackerDuration)}</Text>
			</Box>
		</Box>
	)
}

const App = ({ token }) => {
	const [selected, setSelected] = React.useState(0)
	const [trackers, setTrackers] = React.useState(false)
	const { exit } = useApp()

	useInput((input, key) => {
		if (key.upArrow) {
			setSelected(Math.max(0, selected - 1))
		} else if (key.downArrow) {
			setSelected(Math.min((trackers || []).length - 1, selected + 1))
		} else if (key.escape) {
			exit()
		} else if (key.return || input === " ") {
			// get selected
			const item = trackers[selected]
			if (item && item.id) toggleTracker(item.id, token)
		}
	})

	useInterval(async () => {
		setTrackers(await getTrackers(token))
	}, 500)

	return (
		<Box>
			{trackers === false && <Text>Loading your trackers</Text>}
			{trackers !== false && (
				<Box flexDirection="column">
					{trackers.map((tracker, index) => {
						return (
							<Tracker
								key={tracker.id}
								selected={index === selected}
								tracker={tracker}
							/>
						)
					})}
				</Box>
			)}
		</Box>
	)
}

App.propTypes = {
	name: PropTypes.string
}

App.defaultProps = {
	name: "Stranger"
}

module.exports = App
