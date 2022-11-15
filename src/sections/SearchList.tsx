import React, { useContext } from "react"
import Spinner from "ink-spinner"
import { Text } from "ink"
import useSWR from "swr"

import { getListIssues } from "../api"
import { TokenContext } from "../context"
import { List } from "../components/List"
import { Config } from "types"

const fetchSearchItems = async (search: string, token: Config) => {
  const items = await getListIssues(search, token)
  return items.map(({ key, summaryText, id }) => ({
    value: id,
    label: `${key} - ${summaryText}`,
    key,
  }))
}

export function SearchList(props: {
  search?: string
  onSelect: (item: { key: string; label: string }) => void
  onHighlight?: (item: { key: string; label: string }, index: number) => void
  preload: boolean
  focus: boolean
}) {
  const token = useContext(TokenContext)
  const searchQuery = props.search?.trim() ?? ""

  const search = useSWR([searchQuery, token], fetchSearchItems)
  const items = searchQuery || props.preload ? search.data ?? [] : []

  if (!props.focus && !props.preload) {
    return null
  }

  return (
    <>
      <List
        items={items}
        focus={props.focus}
        onHighlight={props.onHighlight}
        onSelect={props.onSelect}
        limit={5}
      />
      {search.isValidating && (
        <Text>
          <Spinner type="dots" /> Loading results
        </Text>
      )}
    </>
  )
}
