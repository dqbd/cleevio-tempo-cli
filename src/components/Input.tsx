import React, { ReactNode, useState } from "react"
import { Text } from "ink"
import chalk from "chalk"
import { useActiveInput } from "../hooks"
import Spinner from "ink-spinner"

export const Input = ({
  value,
  loading,
  onChange,
  onSubmit,
  placeholder,
  focus,
  minWidth = 0,
  spacing = true,
  loadingPlaceholder = "Loading",
}: {
  value: string
  loading?: boolean
  onChange: (value: string) => void
  onSubmit?: () => void
  placeholder?: string
  focus?: boolean
  minWidth?: number
  spacing?: boolean
  loadingPlaceholder?: string
}) => {
  const [cursorOffset, setCursorOffset] = useState(value?.length || 0)
  const hasValue = (value || "").length > 0

  useActiveInput(
    (input, key, raw) => {
      if (key.upArrow || key.downArrow || (key.ctrl && input === "c")) return

      if (key.return) {
        if (onSubmit) onSubmit()
        return
      }
      let newValue = value,
        newOffset = cursorOffset
      if (key.leftArrow) {
        newOffset -= 1
      } else if (key.rightArrow) {
        newOffset += 1
      } else if (raw === "\x08" || raw === "\x7F") {
        newValue =
          value.slice(0, cursorOffset - 1) +
          value.slice(cursorOffset, value?.length)
        newOffset -= 1
      } else {
        newValue =
          value.slice(0, cursorOffset) +
          String(input) +
          value.slice(cursorOffset, value.length)

        newOffset += String(input).length
      }

      setCursorOffset(Math.max(0, Math.min((newValue ?? "").length, newOffset)))

      if (newValue !== value) {
        onChange(newValue)
      }
    },
    {
      active: focus,
    }
  )

  let renderedValue: ReactNode = value
  if (!hasValue) renderedValue = placeholder

  if (focus) {
    if (hasValue) {
      renderedValue = value?.length ? "" : chalk.inverse(" ")

      for (let i = 0; i < value.length; ++i) {
        const char = value[i]
        renderedValue += i === cursorOffset ? chalk.inverse(char) : char
      }

      if (value?.length && cursorOffset === value.length) {
        renderedValue += chalk.inverse(" ")
      }

      for (let i = 0; i < minWidth - value.length - 1; ++i) {
        renderedValue += " "
      }
    } else if (placeholder) {
      renderedValue = chalk.inverse(placeholder)
    }
  }

  if (loading) {
    renderedValue = (
      <>
        <Spinner type="dots" />
        {` ${loadingPlaceholder}`.padEnd(minWidth - 1, " ")}
      </>
    )
  }

  return (
    <Text>
      {spacing && " "}
      {renderedValue}
      {spacing && " "}
    </Text>
  )
}
