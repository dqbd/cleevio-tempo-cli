import React, { useRef, useState, useEffect, useContext } from "react"
import Spinner from "ink-spinner"
import { Text } from "ink"

import { useIsMounted } from "../hooks"
import { getListIssues } from "../api"
import { TokenContext } from "../context"
import { List } from "../components/List"
import { Config } from "types"

const fetchSearchItems = async (search: string, token: Config) => {
  const items = await getListIssues(search, token)
  return {
    search,
    items: items.map(({ key, summaryText, id }) => ({
      value: id,
      label: `${key} - ${summaryText}`,
      key,
    })),
  }
}

export function SearchList(props: {
  search?: string
  onSelect: (item: { key: string; label: string }) => void
  onHighlight?: (item: { key: string; label: string }, index: number) => void
  preload: boolean
  focus: boolean
}) {
  const token = useContext(TokenContext)
  const [items, setItems] = useState<{ key: string; label: string }[]>([])
  const [loading, setLoading] = useState(false)
  const isMounted = useIsMounted()
  const queryRef = useRef(props.search)
  const hasSearch = !!props.search?.trim()

  useEffect(() => {
    queryRef.current = props.search

    if (token && (hasSearch || props.preload)) {
      setItems([])
      setLoading(true)
      fetchSearchItems(props.search ?? "", token).then((payload) => {
        if (queryRef.current === payload.search && isMounted.current) {
          setItems(payload.items)
          setLoading(false)
        }
      })
    } else {
      isMounted.current && setItems([])
    }
  }, [
    token,
    hasSearch,
    props.preload,
    props.search,
    setLoading,
    queryRef,
    isMounted,
  ])

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
      {loading && (
        <Text>
          <Spinner type="dots" /> Loading results
        </Text>
      )}
    </>
  )
}
