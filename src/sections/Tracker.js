import React, { useState, useCallback, useEffect, useContext } from "react"
import { Text, Color, Box } from "ink"
import parseDuration from "parse-duration"
import open from "open"

import {
  SELECT_ROW,
  CHANGE_ISSUE,
  DESCRIPTION,
  LOG,
  DELETE,
  SELECT_TIME,
} from "../constants"

import {
  useIsMounted,
  useActiveInput,
  useAsyncEffect,
  usePrevious,
} from "../hooks"
import {
  deleteTracker,
  updateTracker,
  toggleTracker,
  createWorklog,
} from "../api"
import {
  getTimeSpent,
  centerText,
  formatTime,
  getDescriptionTime,
  updateDescriptionTime,
} from "../utils"
import { TokenContext } from "../context"

import { SearchList } from "./SearchList"
import { Input } from "../components/Input"

export function Tracker({
  tracker,
  selected,
  onUpdate,
  onDelete,
  lock,
  now,
  row,
}) {
  const toggleTime = selected && row === SELECT_TIME
  const toggleState = selected && row === SELECT_ROW
  const toggleIssue = selected && row === CHANGE_ISSUE
  const toggleLog = selected && row === LOG
  const toggleDelete = selected && row === DELETE

  const token = useContext(TokenContext)
  const isMounted = useIsMounted()
  const [loadEvent, setLoadEvent] = useState(null)
  const [search, setSearch] = useState("")
  const [time, setTime] = useState("")

  useActiveInput(
    async (input, key) => {
      if (key.return || input === " ") {
        if (toggleState) {
          setLoadEvent({
            row: SELECT_ROW,
            value: tracker.isPlaying ? "Stopping" : "Starting",
          })
          onUpdate(await toggleTracker(tracker.id, token))
          isMounted.current && setLoadEvent(null)
        } else if (toggleIssue) {
          if (!search && tracker.issueKey) {
            open(`https://cleevio.atlassian.net/browse/${tracker.issueKey}`)
          }
        } else if (toggleLog) {
          if (!tracker.issueKey) {
            return
          }

          // pause the timer first if not paused
          if (tracker.isPlaying) {
            setLoadEvent({
              row: LOG,
              value: "Stopping",
            })
            onUpdate(await toggleTracker(tracker.id, token))
          }

          setLoadEvent({
            row: LOG,
            value: "Logging",
          })

          // log the time
          const worklog = await createWorklog(
            {
              issueKey: tracker.issueKey,
              timeSpentSeconds: Math.abs(
                Math.ceil(
                  getTimeSpent(
                    tracker.time.trackerDuration,
                    tracker.description,
                    Date.now()
                  ) / 1000
                )
              ),
            },
            token
          )

          // delete the tracker if successfull
          if (worklog.self) {
            setLoadEvent({
              row: LOG,
              value: "Deleting",
            })
            await deleteTracker(tracker.id, token)
            onDelete(tracker)
          }

          isMounted.current && setLoadEvent(null)
        } else if (toggleDelete) {
          setLoadEvent({
            row: DELETE,
            value: "Deleting",
          })
          await deleteTracker(tracker.id, token)
          onDelete(tracker)
        }
      }
    },
    {
      active: !!selected,
    }
  )

  const handleSearchChange = useCallback(
    (value) => {
      lock({ all: value && value.trim(), y: !!toggleIssue })
      setSearch(value)
    },
    [lock, setSearch, toggleIssue]
  )

  const handleItemSelect = useCallback(
    async (item) => {
      if (item) {
        const { key, value: id } = item
        setLoadEvent({ row: CHANGE_ISSUE })
        onUpdate(
          await updateTracker(
            tracker.id,
            {
              issueId: id,
              issueKey: key,
            },
            token
          )
        )
        setLoadEvent(null)
      }
      handleSearchChange("")
    },
    [tracker.id, onUpdate, token]
  )

  const handleTimeChange = useCallback(
    (value) => {
      lock({ all: value && value.trim() })
      setTime(value)
    },
    [lock, setTime]
  )

  const handleTimeSubmit = useCallback(async () => {
    if (!time?.trim()) return

    setLoadEvent({ row: SELECT_TIME })

    const { id, description } = tracker
    const offset = getDescriptionTime(description || "") + parseDuration(time)
    onUpdate(
      await updateTracker(
        id,
        {
          description: updateDescriptionTime(description, offset),
        },
        token
      )
    )
    if (isMounted.current) {
      handleTimeChange("")
      setLoadEvent(null)
    }
  }, [time, token, onUpdate, tracker])

  useEffect(() => {
    if (!toggleIssue) {
      handleSearchChange("")
    } else {
      lock({ y: true })
    }
  }, [handleSearchChange, toggleIssue])

  let state = tracker.isPlaying ? "Stop" : "Play"
  if (loadEvent && loadEvent.row === SELECT_ROW) state = loadEvent.value
  state = centerText(state, 10)

  return (
    <Box flexDirection="column">
      <Box key={tracker.id}>
        <Box>
          <Color bgGreen={tracker.isPlaying} bgRed={!tracker.isPlaying}>
            <Input
              value={time}
              loading={loadEvent?.row === SELECT_TIME}
              loadingPlaceholder="Saving"
              minWidth={9}
              onChange={handleTimeChange}
              placeholder={formatTime(
                Math.floor(
                  getTimeSpent(
                    tracker.time.trackerDuration,
                    tracker.description,
                    now
                  ) / 1000
                )
              )}
              focus={toggleTime}
              onSubmit={handleTimeSubmit}
            />
          </Color>
        </Box>
        <Color
          white={toggleState}
          yellow={!toggleState && tracker.isPlaying}
          bgYellow={toggleState && tracker.isPlaying}
          green={!toggleState && !tracker.isPlaying}
          bgGreen={toggleState && !tracker.isPlaying}
        >
          <Text bold={!!toggleState}>{state}</Text>
        </Color>
        <Color
          white={toggleLog}
          gray={!toggleLog && !tracker.issueKey}
          inverse={toggleLog && !tracker.issueKey}
          blue={!toggleLog && tracker.issueKey}
          bgBlue={toggleLog && tracker.issueKey}
        >
          <Text bold={!!(toggleLog && tracker.issueKey)}>
            {loadEvent?.row !== LOG && centerText("Log Time", 10)}
            {loadEvent?.row === LOG &&
              centerText(loadEvent?.value || "Logging", 10)}
          </Text>
        </Color>
        <Color red={!toggleDelete} bgRed={toggleDelete} white={toggleDelete}>
          <Text bold={!!toggleDelete}>
            {loadEvent?.row === DELETE && centerText("Deleting", 10)}
            {loadEvent?.row !== DELETE && centerText("Delete", 10)}
          </Text>
        </Color>
        <Color bgBlue={toggleIssue}>
          <Input
            value={search}
            onChange={handleSearchChange}
            loading={loadEvent?.row === CHANGE_ISSUE}
            loadingPlaceholder="Saving"
            placeholder={
              tracker?.issueKey ?? (toggleIssue ? "type an issue..." : "...")
            }
            focus={toggleIssue}
          />
          {toggleIssue ? "(open browser) " : ""}
        </Color>
      </Box>
      <SearchList
        search={search}
        token={token}
        focus={!!search?.trim() || toggleIssue}
        preload={!search?.trim() && toggleIssue}
        onSelect={handleItemSelect}
      />
    </Box>
  )
}
