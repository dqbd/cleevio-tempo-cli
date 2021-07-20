import React, { useContext, useCallback, useState } from "react"
import { Text, Box } from "ink"
import { createTracker } from "../api"
import { TokenContext } from "../context"
import { LockCallback, useActiveInput } from "../hooks"
import { SearchList } from "./SearchList"
import { Input } from "../components/Input"
import Spinner from "ink-spinner"
import { TrackerDto } from "types"

export const NewTimer = ({
  selected,
  onCreate,
  lock,
}: {
  selected: boolean
  onCreate: (item: TrackerDto) => void
  lock: LockCallback
}) => {
  const token = useContext(TokenContext)
  const [loading, setLoading] = useState(false)

  const [focusList, setFocusList] = useState(false)
  const [activeList, setActiveList] = useState(false)

  const [search, setSearch] = useState("")

  const hasSearch = !!search?.trim()

  useActiveInput(
    async (_, key) => {
      if (key.return) {
        if (!focusList) {
          setLoading(true)
          onCreate(await createTracker(token))
          setLoading(false)
        }
      } else if (key.downArrow) {
        setFocusList(true)
        lock({ all: true })
      } else if (key.upArrow) {
        if (!activeList) {
          setFocusList(false)
          lock({ all: false })
        }
      }
    },
    { active: !!selected && !hasSearch }
  )

  const handleHighlight = (
    _: { key: string; label: string },
    index: number
  ) => {
    if (index !== 0) {
      setActiveList(true)
    } else {
      setActiveList(false)
    }
  }

  const handleChange = useCallback(
    (value) => {
      lock({ all: value && value.trim() })
      setSearch(value)
    },
    [lock, setSearch]
  )

  const handleItemSelect = useCallback(
    async (item) => {
      if (item) {
        setLoading(true)
        setFocusList(false)
        setActiveList(false)
        onCreate(
          await createTracker(token, {
            issueId: item.value,
            issueKey: item.key,
          })
        )
        setLoading(false)
      }
      handleChange("")
    },
    [token, onCreate, handleChange]
  )

  if (!token) return null
  if (loading)
    return (
      <Text>
        <Spinner type="dots" /> Creating a new timer...
      </Text>
    )

  let color = undefined
  if (!selected) color = "gray"
  if (!search?.trim() && !focusList && selected) color = "blue"

  return (
    <Box flexDirection="column">
      <Text color={color}>
        {`[${selected ? "+" : " "}]`}
        <Input
          value={search}
          onChange={handleChange}
          placeholder={`Create a new timer`}
          focus={selected}
        />
        {selected && !search && "(or type an issue)"}
      </Text>
      <SearchList
        search={search}
        focus={!!search?.trim() || focusList}
        preload={selected}
        onSelect={handleItemSelect}
        onHighlight={handleHighlight}
      />
    </Box>
  )
}
