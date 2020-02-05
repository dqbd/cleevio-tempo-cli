import React, { useRef, useState, useEffect, useContext } from "react"
import SelectInput from "ink-select-input"
import { useIsMounted } from "../hooks"
import { getListIssues } from "../api"
import { TokenContext } from "../context"
import Spinner from "ink-spinner"
import { Text } from "ink"

const fetchSearchItems = async (search, token) => {
  const items = await getListIssues(search, token)
  return {
    search,
    items: items.map(({ key, summaryText, id }) => ({
      value: id,
      label: `${key} - ${summaryText}`,
      key
    }))
  }
}

export function SearchList({ search, onSelect, focus }) {
  const token = useContext(TokenContext)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const isMounted = useIsMounted()
  const queryRef = useRef(search)

  const hasSearch = !!(search && search.trim())

  useEffect(() => {
    queryRef.current = search

    if (hasSearch) {
      setItems([])
      setLoading(true)
      fetchSearchItems(search, token).then(payload => {
        if (queryRef.current === payload.search && isMounted.current) {
          setItems(payload.items)
          setLoading(false)
        }
      })
    } else {
      isMounted.current && setItems([])
    }
  }, [hasSearch, search, setLoading, queryRef, isMounted])

  if (!hasSearch) return null
  return (
    <>
      {loading && <Text><Spinner type="dots" /> Loading results</Text>}
      <SelectInput items={items} focus={focus} onSelect={onSelect} limit={5} />
    </>
  )
}
