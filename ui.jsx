"use strict"

const React = require("react")
const { Text, Color, Box, useInput, useApp } = require("ink")
const open = require("open")
const {
	toggleTracker,
	getTrackers,
	createTracker,
	deleteTracker
} = require("./toggleTracker")

const SELECT_ROW = 0
const CHANGE_ISSUE = 1
const LOG = 2
const DELETE = 3

const stateOrder = [SELECT_ROW, CHANGE_ISSUE, LOG, DELETE]

function useIsMounted() {
	const isMounted = React.useRef(false)
	React.useEffect(() => {
		isMounted.current = true
		return () => (isMounted.current = false)
	}, [])
	return isMounted
}

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

const getTimeSpent = (trackerDuration, now) => {
	let len = 0
	for (let { start, end } of trackerDuration) {
		const startVal = parseDate(start)
		const endVal = parseDate(end) || now

		if (startVal === null) continue
		len += endVal - startVal
	}

	return formatTime(Math.floor(len / 1000))
}

const centerText = (text, width) => {
	let rightPad = Math.floor((width - text.length) / 2)
	let leftPad = width - Math.min(width, text.length + rightPad)

	return [" ".repeat(leftPad), text, " ".repeat(rightPad)].join("")
}

function Tracker({ tracker, selected, onUpdate, token, now, row }) {
	const [loadEvent, setLoadEvent] = React.useState(null)
	const isMounted = useIsMounted()

	const toggleState = selected && row === SELECT_ROW
	const toggleIssue = selected && row === CHANGE_ISSUE
	const toggleLog = selected && row === LOG
	const toggleDelete = selected && row === DELETE

	useInput(async (input, key) => {
		if (key.return || input === " ") {
			if (toggleState) {
				setLoadEvent({
					row: SELECT_ROW,
					value: tracker.isPlaying ? "STOPPING" : "STARTING"
				})
				const newTracker = await toggleTracker(tracker.id, token)
				onUpdate(newTracker)
				isMounted.current && setLoadEvent(null)
			} else if (toggleIssue) {
			} else if (toggleLog) {
				open(
					`https://cleevio.atlassian.net/plugins/servlet/ac/is.origo.jira.tempo-plugin/tempo-my-work#!/tracker/${tracker.id}?redirectUrl=https://cleevio.atlassian.net/jira/your-work`
				)
			} else if (toggleDelete) {
				setLoadEvent({
					row: DELETE,
					value: "Deleting"
				})
				await deleteTracker(tracker.id, token)
			}
		}
	})

	let state = tracker.isPlaying ? "WORK" : "IDLE"
	if (loadEvent && loadEvent.row === SELECT_ROW) state = loadEvent.value

	state = toggleState ? `[${centerText(state, 8)}]` : centerText(state, 10)

	let desc = tracker.issueKey || "None"
	desc = ` ${desc} `

	return (
		<Box key={tracker.id}>
			<Box marginRight={1}>
				<Color
					bgYellow={loadEvent && loadEvent.row === SELECT_ROW}
					bgGreen={
						!(loadEvent && loadEvent.row === SELECT_ROW) && tracker.isPlaying
					}
					bgRed={
						!(loadEvent && loadEvent.row === SELECT_ROW) && !tracker.isPlaying
					}
				>
					<Text bold={toggleState}>{state}</Text>
				</Color>
			</Box>
			<Box marginRight={1}>
				<Color dim>
					<Text>{getTimeSpent(tracker.time.trackerDuration, now)}</Text>
				</Color>
			</Box>
			<Box flexGrow={1} textWrap="truncate">
				<Color bgBlue={toggleIssue}>
					<Text>{desc}</Text>
				</Color>
			</Box>
			<Color green={!toggleLog} bgGreen={toggleLog} white={toggleLog}>
				{centerText("Log", 5)}
			</Color>
			<Color red={!toggleDelete} bgRed={toggleDelete} white={toggleLog}>
				{centerText(
					loadEvent && loadEvent.row === DELETE ? "Deleting" : "Delete",
					10
				)}
			</Color>
		</Box>
	)
}

const NewTimer = ({ selected, token, onCreate }) => {
	const [loading, setLoading] = React.useState(false)

	useInput(async (_, key) => {
		if (key.return && selected) {
			setLoading(true)
			onCreate(await createTracker(token))
			setLoading(false)
		}
	})

	return (
		<Box>
			{selected && !loading && <Text>[+] Create a new timer</Text>}
			{!selected && !loading && <Text>[ ] Create a new timer</Text>}
			{loading && <Text>Creating a new timer...</Text>}
		</Box>
	)
}

const App = ({ token }) => {
	const isMounted = useIsMounted()
	const [now, setNow] = React.useState(Date.now())

	const [trackers, setTrackers] = React.useState(false)
	const [selected, setSelected] = React.useState(0)
	const [row, setRow] = React.useState(SELECT_ROW)

	const { exit } = useApp()

	const setSortedTrackers = React.useCallback(
		trackers => {
			if (isMounted.current) {
				setTrackers(
					(trackers || []).sort(
						({ createdDate: a }, { createdDate: b }) =>
							parseDate(a) - parseDate(b)
					)
				)
			}
		},
		[isMounted, setTrackers]
	)

	const handleUpdate = React.useCallback(
		tracker => {
			setSortedTrackers(
				trackers.map(tempTracker => {
					if (tempTracker.id === tracker.id) {
						return tracker
					}
					return tempTracker
				})
			)
		},
		[setSortedTrackers, trackers]
	)

	const handleCreate = React.useCallback(
		tracker => {
			setSortedTrackers([...trackers, tracker])
		},
		[setSortedTrackers, trackers]
	)

	useInput((_, key) => {
		const trackersLen = (trackers || []).length

		if (key.upArrow) {
			setSelected(Math.max(0, selected - 1))
		} else if (key.downArrow) {
			setSelected(Math.min(trackersLen, selected + 1))
		} else if (key.leftArrow && selected !== trackersLen) {
			setRow(Math.max(0, row - 1))
		} else if (key.rightArrow && selected !== trackersLen) {
			setRow(Math.min(stateOrder.length - 1, row + 1))
		}
	})

	useInput((_, key) => key.escape && exit())

	useInterval(async () => {
		const newTrackers = await getTrackers(token)
		setSortedTrackers(newTrackers)
	}, 500)

	useInterval(() => setNow(Date.now()), 100)

	return (
		<Box flexGrow={1}>
			{trackers === false && <Text>Loading your trackers</Text>}
			{trackers !== false && (
				<Box flexDirection="column" flexGrow={1}>
					{trackers.map((tracker, index) => {
						return (
							<Tracker
								key={tracker.id}
								selected={index === selected}
								tracker={tracker}
								token={token}
								onUpdate={handleUpdate}
								now={now}
								row={row}
							/>
						)
					})}
					<NewTimer
						token={token}
						selected={selected === (trackers || []).length}
						onCreate={handleCreate}
					/>
				</Box>
			)}
		</Box>
	)
}

module.exports = App
