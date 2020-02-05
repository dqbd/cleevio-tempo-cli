import React, { useContext, useCallback, useState } from "react"
import { Text, Box } from "ink"
import { createTracker } from "../api"
import { TokenContext } from "../context"
import { useActiveInput } from "../hooks"
import { Description } from "./Description"
import { SearchList } from "./SearchList"

export const NewTimer = ({ selected, onCreate, onArrowFreeze }) => {
  const token = useContext(TokenContext)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

  const hasSearch = !!search?.trim()

  useActiveInput(
    async (_, key) => {
      if (key.return) {
        setLoading(true)
        onCreate(await createTracker(token))
        setLoading(false)
      }
    },
    {
      active: !!selected && !hasSearch
    }
  )

  const handleChange = useCallback(
    value => {
      onArrowFreeze(value && value.trim())
      setSearch(value)
    },
    [onArrowFreeze, setSearch]
  )

  const handleItemSelect = useCallback(
    async item => {
      if (item) {
        setLoading(true)
        await createTracker(token, {
          issueId: item.value,
          issueKey: item.key
        })
        setLoading(false)
      }
      handleChange("")
    },
    [token]
  )

  if (loading) return <Text>Creating a new timer...</Text>
  return (
    <Box flexDirection="column">
      <Box>
        {`[${selected ? "+" : " "}]`}
        <Description
          value={search}
          onChange={handleChange}
          placeholder={`Create a new timer`}
          focus={selected}
        />
        {selected && !search && "(or type an issue)"}
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
