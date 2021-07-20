import React from "react"
import { Box } from "ink"

const DESC_REGEX =
  /\s*cleevio-tempo-cli:<(?<human>.*?)><(?<timestamp>[+-]?[0-9]*)>\s*/gm

export const parseDate = (str: string | null) =>
  typeof str === "string" ? Date.parse(`${str}Z`) : null

export const getStartDate = (timestamp = Date.now()) => {
  const date = new Date(timestamp)
  return [
    date.getFullYear(),
    `${date.getMonth() + 1}`.padStart(2, "0"),
    `${date.getDate()}`.padStart(2, "0"),
  ].join("-")
}

export const formatTime = (seconds: number) => {
  const absSeconds = Math.abs(seconds)
  const h = Math.floor(absSeconds / 3600)
  const m = Math.floor((absSeconds % 3600) / 60)
  const s = absSeconds % 60
  const result = [h, m, s].map((i) => `${i}`.padStart(2, "0")).join(":")
  if (seconds < 0) return `-${result}`
  return ` ${result}`
}

export const getTimeSpent = (
  trackerDuration: { start: string | null; end: string | null }[],
  description: string,
  now: number
) => {
  let len = getDescriptionTime(description)
  for (let { start, end } of trackerDuration) {
    const startVal = parseDate(start)
    const endVal = parseDate(end) || now

    if (startVal === null) continue
    len += endVal - startVal
  }

  return len
}

export const getDescriptionTime = (content: string) => {
  let match = undefined
  let result = 0
  do {
    match = DESC_REGEX.exec(content || "")
    if (match?.groups) {
      result += Number.parseInt(match.groups.timestamp)
    }
  } while (match)

  return result
}

export const updateDescriptionTime = (
  content: string | null,
  timestamp: number
): string | null => {
  if (content === null && (typeof timestamp !== "number" || timestamp === 0))
    return null

  let result = (content || "").replace(DESC_REGEX, "")
  if (typeof timestamp === "number" && timestamp !== 0) {
    result += `\ncleevio-tempo-cli:<${formatTime(
      Math.floor(timestamp / 1000)
    ).trim()}><${timestamp}>\n`
  }
  return result
}

const centerItems = (item: string, itemWidth: number, width: number) => {
  let rightPad = Math.floor((width - itemWidth) / 2)
  let leftPad = width - Math.min(width, itemWidth + rightPad)

  return [" ".repeat(leftPad), item, " ".repeat(rightPad)]
}

export const centerNode = (node: string, nodeWidth: number, width: number) => {
  const [left, item, right] = centerItems(node, nodeWidth, width)
  return (
    <Box>
      {left}
      {item}
      {right}
    </Box>
  )
}

export const centerText = (text: string, width: number) => {
  return centerItems(text, text.length, width).join("")
}
