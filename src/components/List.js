"use strict"
import React, { useContext } from "react"
import { Tracker } from "./Tracker"
import { NewTimer } from "./NewTimer"
import { useInterval, useIsMounted, useActiveInput } from "../hooks"

import { Text, Box } from "ink"
import { getTrackers } from "../api"
import { stateOrder, SELECT_ROW } from "../constants"
import { parseDate } from "../utils"
import { TokenContext } from "../context"
import Spinner from "ink-spinner"

export const List = () => {
  const token = useContext(TokenContext)
  const isMounted = useIsMounted()
  const [now, setNow] = React.useState(Date.now())
  const [arrowFreeze, setArrowFreeze] = React.useState(false)

  const [trackers, setTrackers] = React.useState(false)
  const [selected, setSelected] = React.useState(0)
  const [row, setRow] = React.useState(SELECT_ROW)

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

  useInterval(async () => {
    const newTrackers = await getTrackers(token)
    setSortedTrackers(newTrackers)
  }, 500)

  useInterval(() => setNow(Date.now()), 100)

  return (
    <Box flexGrow={1}>
      {trackers === false && (
        <Text>
          <Spinner type="dots" /> Loading your trackers
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
