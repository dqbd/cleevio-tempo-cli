import React, { useState, useCallback, useEffect } from "react"
import open from "open"
import { Text, Color, Box, useInput } from "ink"
import TextInput from "ink-text-input"

import {
	SELECT_ROW,
	CHANGE_ISSUE,
	DESCRIPTION,
	LOG,
	DELETE
} from "../constants"

import { useIsMounted } from "../hooks"

import { SearchList } from "./SearchList"
import { getTimeSpent, centerText } from "../utils"
import { deleteTracker, updateTracker } from "../api"

export function Tracker({
	tracker,
	selected,
	onUpdate,
	onArrowFreeze,
	token,
	now,
	row
}) {
	const isMounted = useIsMounted()
	const [loadEvent, setLoadEvent] = useState(null)
	const [search, setSearch] = useState("")
	const [desc, setDesc] = useState("")
	const handleSearchChange = useCallback(
		value => {
			onArrowFreeze(value && value.trim())
			setSearch(value)
		},
		[onArrowFreeze, setSearch]
	)
	const toggleState = selected && row === SELECT_ROW
	const toggleIssue = selected && row === CHANGE_ISSUE
	const toggleDesc = selected && row === DESCRIPTION
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
				if (!search && tracker.issueKey) {
					open(`https://cleevio.atlassian.net/browse/${tracker.issueKey}`)
				}
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
	const handleItemSelect = useCallback(
		async item => {
			if (item) {
				const { key, value: id } = item
				await updateTracker(
					tracker.id,
					{
						issueId: id,
						issueKey: key
					},
					token
				)
			}
			handleSearchChange("")
		},
		[tracker.id, token]
	)
	useEffect(() => {
		if (!toggleIssue) handleSearchChange("")
	}, [toggleIssue])
	useEffect(() => {
		if (!toggleDesc && desc && desc.trim()) {
			;(async () => {
				onUpdate(
					await updateTracker(
						tracker.id,
						{
							description: desc
						},
						token
					)
				)
				isMounted && setDesc("")
			})()
		}
	}, [toggleDesc, isMounted, desc, tracker.id, token, onUpdate])
	let state = tracker.isPlaying ? "WORK" : "IDLE"
	if (loadEvent && loadEvent.row === SELECT_ROW) state = loadEvent.value
	state = toggleState ? `[${centerText(state, 8)}]` : centerText(state, 10)
	let issueKey = tracker.issueKey || "None"
	issueKey = ` ${issueKey} `
	let issueDesc =
		tracker.description || (toggleDesc ? "type description..." : "")
	return (
		<Box flexDirection="column">
			<Box key={tracker.id}>
				<Box marginRight={1}>
					<Color
						bgYellow={loadEvent && loadEvent.row === SELECT_ROW}
						bgGreen={
							!(loadEvent && loadEvent.row === SELECT_ROW) && tracker.isPlaying
						}
						bgBlue={
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
				<Box flexGrow={1} marginRight={1}>
					<Color bgBlue={toggleIssue}>
						<TextInput
							value={search}
							onChange={handleSearchChange}
							placeholder={issueKey}
							focus={toggleIssue}
						/>
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
			<SearchList
				search={search}
				token={token}
				focus={!!(search && search.trim())}
				onSelect={handleItemSelect}
			/>
		</Box>
	)
}
