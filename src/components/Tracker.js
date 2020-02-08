import React, { useState, useCallback, useEffect, useContext } from "react"
import { Text, Color, Box } from "ink"
import Spinner from "ink-spinner"
import open from "open"

import {
  SELECT_ROW,
  CHANGE_ISSUE,
  DESCRIPTION,
  LOG,
  DELETE
} from "../constants"

import { useIsMounted, useActiveInput, useAsyncEffect } from "../hooks"
import { deleteTracker, updateTracker, toggleTracker } from "../api"
import { getTimeSpent, centerText } from "../utils"
import { TokenContext } from "../context"

import { SearchList } from "./SearchList"
import { Input } from "./Input"

export function Tracker({
  tracker,
  selected,
  onUpdate,
  onDelete,
  onArrowFreeze,
  now,
  row
}) {
  const toggleState = selected && row === SELECT_ROW
  const toggleIssue = selected && row === CHANGE_ISSUE
  const toggleDesc = selected && row === DESCRIPTION
  const toggleLog = selected && row === LOG
  const toggleDelete = selected && row === DELETE

  const token = useContext(TokenContext)
  const isMounted = useIsMounted()
  const [loadEvent, setLoadEvent] = useState(null)
  const [search, setSearch] = useState("")
  const [desc, setDesc] = useState("")

  useActiveInput(
    async (input, key) => {
      if (key.return || input === " ") {
        if (toggleState) {
          setLoadEvent({
            row: SELECT_ROW,
            value: tracker.isPlaying ? "STOPPING" : "STARTING"
          })
          onUpdate(await toggleTracker(tracker.id, token))
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
          onDelete(tracker)
        }
      }
    },
    {
      active: !!selected
    }
  )

  const handleSearchChange = useCallback(
    value => {
      onArrowFreeze(value && value.trim())
      setSearch(value)
    },
    [onArrowFreeze, setSearch]
  )

  const handleItemSelect = useCallback(
    async item => {
      if (item) {
        const { key, value: id } = item
        onUpdate(await updateTracker(
          tracker.id,
          {
            issueId: id,
            issueKey: key
          },
          token
        ))
      }
      handleSearchChange("")
    },
    [tracker.id, onUpdate, token]
  )

  useEffect(() => {
    if (!toggleIssue) handleSearchChange("")
  }, [toggleIssue])

  useAsyncEffect(async () => {
    if (!toggleDesc && desc && desc.trim()) {
      onUpdate(
        await updateTracker(
          tracker.id,
          {
            description: desc
          },
          token
        )
      )
      if (isMounted.current) setDesc("")
    }
  }, [toggleDesc, isMounted, desc, tracker.id, token, onUpdate])

  let state = tracker.isPlaying ? "WORK" : "IDLE"
  if (loadEvent && loadEvent.row === SELECT_ROW) state = loadEvent.value
  state = toggleState ? `[${centerText(state, 8)}]` : centerText(state, 10)

  return (
    <Box flexDirection="column">
      <Box key={tracker.id}>
        <Box marginRight={1}>
          <Color dim>
            <Text>{getTimeSpent(tracker.time.trackerDuration, now)}</Text>
          </Color>
        </Box>
        <Color
          bgYellow={loadEvent?.row === SELECT_ROW}
          bgGreen={!(loadEvent?.row === SELECT_ROW) && tracker.isPlaying}
          bgBlue={!(loadEvent?.row === SELECT_ROW) && !tracker.isPlaying}
        >
          <Text bold={toggleState}>{state}</Text>
        </Color>
        <Color green={!toggleLog} bgGreen={toggleLog} white={toggleLog}>
          {` Log Time `.padEnd(10, " ")}
        </Color>
        <Color red={!toggleDelete} bgRed={toggleDelete} white={toggleLog}>
          {loadEvent?.row === DELETE && centerText("Deleting", 10)}
          {loadEvent?.row !== DELETE && centerText("Delete", 10)}
        </Color>
        <Color bgBlue={toggleIssue}>
          <Input
            value={search}
            onChange={handleSearchChange}
            placeholder={
              (tracker?.issueKey &&
                `${tracker.issueKey}${toggleIssue ? " (open browser)" : ""}`) ||
              (toggleIssue ? "type an issue..." : "...")
            }
            focus={toggleIssue}
          />
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
