import React, { useState, useEffect } from "react"
import { Box, Color } from "ink"
import { useActiveInput } from "../hooks"

interface ListItem {
  key: string
  label: string
}

export const List = ({
  items,
  focus,
  onHighlight,
  onSelect,
  hideOnFocus = true,
  limit = 5,
}: {
  items: ListItem[]
  focus: boolean
  onHighlight?: (item: ListItem, index: number) => void
  onSelect: (item: ListItem) => void
  hideOnFocus?: boolean
  limit?: number
}) => {
  const [selectedIndex, setIndex] = useState(0)
  const [pageIndex, setPageIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
    setPageIndex(0)
    if (focus) {
      if (onHighlight) {
        onHighlight(items[0], 0)
      }
    }
  }, [items, focus, onHighlight])

  useActiveInput(
    (_, ctrl) => {
      if (!focus) return

      let nextIndex = selectedIndex
      let nextPageIndex = pageIndex
      if (ctrl.upArrow) {
        nextIndex -= 1
      } else if (ctrl.downArrow) {
        nextIndex += 1
      } else if (ctrl.return) {
        if (onSelect) {
          onSelect(items[nextIndex])
        }
        return
      }

      nextIndex = Math.max(0, Math.min((items || []).length - 1, nextIndex))

      if (onHighlight) {
        onHighlight(items[nextIndex], nextIndex)
      }

      if (nextIndex >= pageIndex + limit) {
        nextPageIndex += 1
      } else if (nextIndex < pageIndex) {
        nextPageIndex -= 1
      }

      nextPageIndex = Math.max(
        0,
        Math.min((items || []).length - 1, nextPageIndex)
      )
      setIndex(nextIndex)
      setPageIndex(nextPageIndex)
    },
    {
      active: focus,
    }
  )

  return (
    <Box flexDirection="column">
      {items
        .slice(pageIndex, pageIndex + limit)
        .map(({ key, label }, relIndex) => {
          const index = relIndex + pageIndex
          const showActive = (!hideOnFocus || focus) && selectedIndex === index
          return (
            <Color key={key} blue={showActive} gray={hideOnFocus && !focus}>
              {showActive ? "> " : "  "}
              {label}
            </Color>
          )
        })}
    </Box>
  )
}
