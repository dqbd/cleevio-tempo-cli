"use strict"
import React, { useContext, useState } from "react"
import { Tracker } from "./Tracker"
import { NewTimer } from "./NewTimer"
import { useInterval, useIsMounted, useActiveInput, useAsyncEffect } from "../hooks"

import { Text, Box } from "ink"
import { getTrackers } from "../api"
import { stateOrder, SELECT_ROW } from "../constants"
import { parseDate } from "../utils"
import { TokenContext } from "../context"
import Spinner from "ink-spinner"

export const List = () => {
  const token = useContext(TokenContext)
  const isMounted = useIsMounted()
  const [now, setNow] = useState(Date.now())
  const [arrowFreeze, setArrowFreeze] = useState(false)

  const [errors, showError] = useState(false)
  const [trackers, setTrackers] = useState(false)
  const [selected, setSelected] = useState(0)
  const [row, setRow] = useState(SELECT_ROW)

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

  const handleDelete = React.useCallback(
    tracker => {
      setSelected(Math.max(0, selected - 1))
      setSortedTrackers(
        trackers.filter(tempTracker => {
          return tempTracker.id !== tracker.id
        })
      )
    },
    [selected, setSortedTrackers, trackers]
  )

  const handleCreate = React.useCallback(
    tracker => {
      setSortedTrackers([...trackers, tracker])
    },
    [setSortedTrackers, trackers]
  )

  const fetchTrackers = React.useCallback(
    async () => {
      try {
        setSortedTrackers(await getTrackers(token))
      } catch {
        if (isMounted.current) showError(true)
      }
    },
    [showError, setSortedTrackers, getTrackers, token, isMounted]
  )

  useActiveInput(
    (_, key) => {
      const trackersLen = (trackers || []).length
      if (key.upArrow) {
        setSelected(Math.max(0, selected - 1))
      } else if (key.downArrow) {
        setSelected(Math.min(trackersLen, selected + 1))
      } else if (key.leftArrow && selected !== trackersLen) {
        setRow(stateOrder[Math.max(0, stateOrder.indexOf(row) - 1)])
      } else if (key.rightArrow && selected !== trackersLen) {
        setRow(
          stateOrder[
            Math.min(stateOrder.length - 1, stateOrder.indexOf(row) + 1)
          ]
        )
      }
    },
    {
      active: !arrowFreeze
    }
  )

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
                onArrowFreeze={setArrowFreeze}
                now={now}
                row={row}
              />
            )
          })}
          <NewTimer
            selected={selected === (trackers || []).length}
            onCreate={handleCreate}
            onArrowFreeze={setArrowFreeze}
          />
        </Box>
      )}
    </Box>
  )
}
