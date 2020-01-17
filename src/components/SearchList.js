import React, { useRef, useState, useEffect } from "react"
import SelectInput from "ink-select-input"
import { useIsMounted } from "../hooks"
import { getListIssues } from "../api"

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

export function SearchList({ search, token, onSelect, focus }) {
	const isMounted = useIsMounted()
	const queryRef = useRef(search)
	const [items, setItems] = useState([])
	const hasSearch = !!(search && search.trim())

	useEffect(() => {
		queryRef.current = search
		if (hasSearch) {
			fetchSearchItems(search, token).then(payload => {
				if (queryRef.current === payload.search) {
					isMounted.current && setItems(payload.items)
				}
			})
		} else {
			isMounted.current && setItems([])
		}
	}, [hasSearch, search, queryRef, isMounted])

	if (!hasSearch) return null
	return (
		<SelectInput items={items} focus={focus} onSelect={onSelect} limit={5} />
	)
}
