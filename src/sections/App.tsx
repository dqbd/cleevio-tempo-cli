import React, { useState, useCallback, useEffect } from "react"
import Conf from "conf"

import { useApp } from "ink"
import { TokenContext } from "../context"
import { TrackerList } from "./TrackerList"
import { Login } from "./Login"

import pkg from "../../package.json"

const config = new Conf<{ tempoToken: string }>({
  schema: {
    tempoToken: {
      type: "string",
    },
  },
  projectName: pkg.name,
  projectVersion: pkg.version,
})

class ErrorBoundary extends React.Component<{
  exit?: (error?: Error) => void
}> {
  componentDidCatch(error: Error) {
    console.log(error)
    this.props.exit?.(error)
    process.exit(1)
  }

  render() {
    return this.props.children
  }
}

const InternalApp = ({ logout }: { logout: boolean; debug: boolean }) => {
  const [token, setToken] = useState(logout ? "" : config.get("tempoToken"))
  const handleToken = useCallback(
    (newToken) => {
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
      <TrackerList />
    </TokenContext.Provider>
  )
}

export const App = (props: { logout: boolean; debug: boolean }) => {
  const appProps = useApp()
  return (
    <ErrorBoundary exit={appProps.exit}>
      <InternalApp {...props} />
    </ErrorBoundary>
  )
}
