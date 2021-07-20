import React, { useState, useCallback, useEffect, useContext } from "react"
import { Text, Box } from "ink"
import parseDuration from "parse-duration"
import open from "open"

import { State } from "../constants"

import { useIsMounted, useActiveInput, LockCallback } from "../hooks"
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
import { TrackerDto } from "types"

function getStateColorProps(toggleState: boolean, isPlaying: boolean) {
  let color = undefined
  let backgroundColor = undefined

  if (toggleState) {
    color = "white"
  } else {
    color = isPlaying ? "yellow" : "green"
  }

  if (toggleState) {
    backgroundColor = isPlaying ? "yellow" : "green"
  }

  return { color, backgroundColor }
}

function getLogColorProps(toggleLog: boolean, hasIssueKey: boolean) {
  let color = undefined
  let backgroundColor = undefined

  if (toggleLog) {
    color = hasIssueKey ? "white" : "inverse"
  } else {
    color = hasIssueKey ? "blue" : "gray"
  }

  if (toggleLog && hasIssueKey) {
    backgroundColor = "blue"
  }

  return { color, backgroundColor }
}

export function Tracker({
  tracker,
  selected,
  onUpdate,
  onDelete,
  lock,
  now,
  row,
}: {
  tracker: TrackerDto
  selected: boolean
  onUpdate: (tracker: TrackerDto) => void
  onDelete: (tracker: TrackerDto) => void
  lock: LockCallback
  now: number
  row: State
}) {
  const toggleTime = selected && row === State.SELECT_TIME
  const toggleState = selected && row === State.SELECT_ROW
  const toggleIssue = selected && row === State.CHANGE_ISSUE
  const toggleLog = selected && row === State.LOG
  const toggleDelete = selected && row === State.DELETE

  const token = useContext(TokenContext)
  const isMounted = useIsMounted()
  const [loadEvent, setLoadEvent] = useState<{
    row: State
    value?: string
  } | null>(null)
  const [search, setSearch] = useState("")
  const [time, setTime] = useState("")

  useActiveInput(
    async (input, key) => {
      if (key.return || input === " ") {
        if (toggleState) {
          setLoadEvent({
            row: State.SELECT_ROW,
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
            setLoadEvent({ row: State.LOG, value: "Stopping" })
            onUpdate(await toggleTracker(tracker.id, token))
          }

          setLoadEvent({ row: State.LOG, value: "Logging" })

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
            setLoadEvent({ row: State.LOG, value: "Deleting" })
            await deleteTracker(tracker.id, token)
            onDelete(tracker)
          }

          isMounted.current && setLoadEvent(null)
        } else if (toggleDelete) {
          setLoadEvent({ row: State.DELETE, value: "Deleting" })
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
        setLoadEvent({ row: State.CHANGE_ISSUE })
        onUpdate(
          await updateTracker(tracker.id, { issueId: id, issueKey: key }, token)
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

    setLoadEvent({ row: State.SELECT_TIME })

    const { id, description } = tracker
    const offset =
      getDescriptionTime(description || "") + (parseDuration(time) ?? 0)

    onUpdate(
      await updateTracker(
        id,
        { description: updateDescriptionTime(description, offset) },
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
      lock({ y: !tracker?.issueKey })
    }
  }, [handleSearchChange, toggleIssue, !tracker?.issueKey])

  let state: string | undefined = tracker.isPlaying ? "Stop" : "Play"
  if (loadEvent && loadEvent.row === State.SELECT_ROW) state = loadEvent.value
  if (state) state = centerText(state, 10)

  return (
    <Box flexDirection="column">
      <Box key={tracker.id}>
        <Box>
          <Text backgroundColor={tracker.isPlaying ? "green" : "red"}>
            <Input
              value={time}
              loading={loadEvent?.row === State.SELECT_TIME}
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
          </Text>
        </Box>
        <Text
          bold={!!toggleState}
          {...getStateColorProps(toggleState, tracker.isPlaying)}
        >
          {state}
        </Text>
        <Text
          bold={!!(toggleLog && tracker.issueKey)}
          {...getLogColorProps(toggleLog, !!tracker.issueKey)}
        >
          {loadEvent?.row !== State.LOG && centerText("Log Time", 10)}
          {loadEvent?.row === State.LOG &&
            centerText(loadEvent?.value || "Logging", 10)}
        </Text>
        <Text
          backgroundColor={toggleDelete ? "red" : undefined}
          color={toggleDelete ? "white" : "red"}
        >
          <Text bold={!!toggleDelete}>
            {loadEvent?.row === State.DELETE && centerText("Deleting", 10)}
            {loadEvent?.row !== State.DELETE && centerText("Delete", 10)}
          </Text>
        </Text>
        <Text backgroundColor={toggleIssue ? "blue" : undefined}>
          <Input
            value={search}
            onChange={handleSearchChange}
            loading={loadEvent?.row === State.CHANGE_ISSUE}
            loadingPlaceholder="Saving"
            placeholder={
              tracker?.issueKey ?? (toggleIssue ? "type an issue..." : "...")
            }
            focus={toggleIssue}
          />
          {toggleIssue ? "(open browser) " : ""}
        </Text>
      </Box>
      <SearchList
        search={search}
        focus={!!search?.trim() || toggleIssue}
        preload={!tracker?.issueKey && toggleIssue}
        onSelect={handleItemSelect}
      />
    </Box>
  )
}
