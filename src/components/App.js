"use strict"
import React from "react"
import { Provider } from "react-redux/lib/alternate-renderers"

import { Text, AppContext } from "ink"
import { TokenContext } from "../context"
import { List } from "./List"
import { store } from "../state"

class ErrorBoundary extends React.Component {
  componentDidCatch(error) {
    console.log(error)
    process.exit(1)
  }

  render() {
    return this.props.children
  }
}

export const App = ({ token }) => {
  if (!token) {
    return <Text>Error: --token is required</Text>
  }

  return (
    <AppContext.Consumer>
      {({ exit }) => (
        <ErrorBoundary exit={exit}>
          <Provider store={store}>
            <TokenContext.Provider value={token}>
              <List />
            </TokenContext.Provider>
          </Provider>
        </ErrorBoundary>
      )}
    </AppContext.Consumer>
  )
}
