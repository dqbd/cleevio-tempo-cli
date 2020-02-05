"use strict"
import React from "react"
import { Provider } from "react-redux/lib/alternate-renderers"


import { Text } from "ink"
import { TokenContext } from "../context"
import { List } from "./List"
import { store } from '../state'

export const App = ({ token }) => {
	if (!token) {
		return <Text>--token is required</Text>
	}

	return (
    <Provider store={store}>
      <TokenContext.Provider value={token}>
        <List />
      </TokenContext.Provider>
    </Provider>
	)
}
