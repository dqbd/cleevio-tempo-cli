"use strict"
import React, { useContext, useCallback, useState, useEffect } from "react"
import { Text, Box } from "ink"

import pkg from "../../package.json"
import {
  useInterval,
  useIsMounted,
  useActiveInput,
  useAsyncEffect,
  useLockableInput,
} from "../hooks"
import { stateOrder, SELECT_ROW } from "../constants"
import { TokenContext } from "../context"
import { parseDate } from "../utils"
import { getTrackers } from "../api"

import { Tracker } from "./Tracker"
import { NewTimer } from "./NewTimer"

import Spinner from "ink-spinner"

const getSortedTrackers = (trackers) => {
  return (trackers || []).sort(
    ({ createdDate: a }, { createdDate: b }) => parseDate(a) - parseDate(b)
  )
}

export const List = () => {
  const token = useContext(TokenContext)
  const isMounted = useIsMounted()
  const [now, setNow] = useState(Date.now())

  const [errors, showError] = useState(false)
  const [trackers, setTrackers] = useState(false)
  const [selected, setSelected] = useState(0)
  const [row, setRow] = useState(SELECT_ROW)

  const setSortedTrackers = (cb) => {
    if (isMounted.current) {
      setTrackers((trackers) => getSortedTrackers(cb([...(trackers || [])])))
    }
  }

  const handleUpdate = (tracker) => {
    setSortedTrackers((trackers) =>
      trackers.map((tempTracker) => {
        if (tempTracker.id === tracker.id) {
          return tracker
        }
        return tempTracker
      })
    )
  }

  const handleDelete = (tracker) => {
    setSelected((selected) => Math.max(0, selected - 1))
    setSortedTrackers((trackers) =>
      trackers.filter((tempTracker) => {
        return tempTracker.id !== tracker.id
      })
    )
  }

  const handleCreate = (tracker) => {
    setSortedTrackers((trackers) => {
      trackers.push(tracker)
      return trackers
    })
  }

  const fetchTrackers = useCallback(async () => {
    try {
      const trackers = await getTrackers(token)
      setSortedTrackers(() => trackers)
      if (isMounted.current) showError(false)
    } catch {
      if (isMounted.current) showError(true)
    }
  }, [token])

  const lock = useLockableInput((_, key) => {
    const trackersLen = (trackers || []).length
    if (key.upArrow) {
      setSelected(Math.max(0, selected - 1))
    } else if (key.downArrow) {
      setSelected(Math.min(trackersLen, selected + 1))
    } else if (key.leftArrow && selected !== trackersLen) {
      setRow(stateOrder[Math.max(0, stateOrder.indexOf(row) - 1)])
    } else if (key.rightArrow && selected !== trackersLen) {
      setRow(
        stateOrder[Math.min(stateOrder.length - 1, stateOrder.indexOf(row) + 1)]
      )
    }
  })

  useEffect(() => {
    const active = (trackers || []).filter(({ isPlaying }) => isPlaying)
    const allHasTags = active.every(({ issueKey }) => !!issueKey)

    if (active.length > 0) {
      if (allHasTags && active.length <= 3) {
        process.title = `${active
          .map(({ issueKey }) => issueKey)
          .join(", ")} | ${pkg.name}`
      } else {
        process.title = `${active.length} running | ${pkg.name}`
      }
    } else {
      process.title = pkg.name
    }
  }, [trackers])

  useAsyncEffect(fetchTrackers, [])
  useInterval(fetchTrackers, 60 * 1000)
  useInterval(() => setNow(Date.now()), 100)

  return (
    <Box flexGrow={1}>
      {(trackers === false || errors) && (
        <Text>
          <Spinner type="dots" /> {!errors && "Loading your trackers"}
          {errors && "Failing to load trackers, retrying"}
        </Text>
      )}
      {trackers !== false && (
        <Box flexDirection="column" flexGrow={1}>
          {trackers.map((tracker, index) => {
            return (
              <Tracker
                key={tracker.id}
                selected={index === selected}
                tracker={tracker}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                lock={lock}
                now={now}
                row={row}
              />
            )
          })}
          <NewTimer
            selected={selected === (trackers || []).length}
            onCreate={handleCreate}
            lock={lock}
          />
        </Box>
      )}
    </Box>
  )
}
