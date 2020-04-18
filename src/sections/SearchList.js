import React, { useRef, useState, useEffect, useContext } from "react"
import Spinner from "ink-spinner"
import { Text } from "ink"

import { useIsMounted } from "../hooks"
import { getListIssues } from "../api"
import { TokenContext } from "../context"
import { List } from "../components/List"

const fetchSearchItems = async (search, token) => {
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

export function SearchList({ search, onSelect, onHighlight, preload, focus }) {
  const token = useContext(TokenContext)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const isMounted = useIsMounted()
  const queryRef = useRef(search)
  const hasSearch = !!(search && search.trim())

  useEffect(() => {
    queryRef.current = search

    if (hasSearch || preload) {
      setItems([])
      setLoading(true)
      fetchSearchItems(search, token).then((payload) => {
        if (queryRef.current === payload.search && isMounted.current) {
          setItems(payload.items)
          setLoading(false)
        }
      })
    } else {
      isMounted.current && setItems([])
    }
  }, [hasSearch, preload, search, setLoading, queryRef, isMounted])

  if (!focus && !preload) {
    return null
  }

  return (
    <>
      <List
        items={items}
        focus={focus}
        onHighlight={onHighlight}
        onSelect={onSelect}
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
