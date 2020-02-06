"use strict"
import React, { useState, useCallback, useEffect } from "react"
import Conf from "conf"

import { AppContext } from "ink"
import { TokenContext } from "../context"
import { List } from "./List"
import { Login } from "./Login"

const config = new Conf({
  schema: {
    tempoToken: {
      type: "string"
    }
  }
})

class ErrorBoundary extends React.Component {
  componentDidCatch(error) {
    console.log(error)
    process.exit(1)
  }

  render() {
    return this.props.children
  }
}

const InternalApp = ({ logout }) => {
  const [token, setToken] = useState(!logout ? config.get("tempoToken") : "")
  const handleToken = useCallback(
    newToken => {
      config.set("tempoToken", newToken)
      setToken(newToken)
    },
    [setToken]
  )

  useEffect(() => {
    if (logout) {
      config.clear()
      setToken("")
    }
  }, [logout])

  if (!token) {
    return <Login onToken={handleToken} />
  }

  return (
    <TokenContext.Provider value={token}>
      <List />
    </TokenContext.Provider>
  )
}

export const App = props => (
  <AppContext.Consumer>
    {({ exit }) => (
      <ErrorBoundary exit={exit}>
        <InternalApp {...props} />
      </ErrorBoundary>
    )}
  </AppContext.Consumer>
)
