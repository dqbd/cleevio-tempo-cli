import React, { useState, useCallback } from "react"
import { Text, Box, Color } from "ink"
import { Description } from "./Description"
import Spinner from "ink-spinner"
import { getTrackers } from "../api"

export const Login = ({ onToken }) => {
  const [loading, setLoading] = useState(false)
  const [errors, showErrors] = useState(false)
  const [value, setValue] = useState("")

  const handleChange = useCallback(
    value => {
      !loading && setValue(value)
    },
    [setValue, loading]
  )

  const handleSubmit = useCallback(async () => {
    if (value?.trim()) {
      setLoading(true)
      try {
        await getTrackers(value)
        onToken(value)
      } catch (err) {
        handleChange("")
        showErrors(true)
        setLoading(false)
      }
    }
  }, [value, setLoading, getTrackers, onToken])

  return (
    <Box flexDirection="column">
      <Color gray>Please enter your Tempo API Token</Color>
      <Color blue>
        https://cleevio.atlassian.net/plugins/servlet/ac/io.tempo.jira/tempo-configuration
      </Color>
      {" "}
      {loading && (
        <Text>
          <Spinner type="dots" /> Logging in
        </Text>
      )}
      {!loading && (
        <Box>
          {!errors && "Token key:"}
          {errors && "Login failed, try again:"}
          <Description
            value={value}
            onChange={handleChange}
            onSubmit={handleSubmit}
            focus={true}
          />
        </Box>
      )}
    </Box>
  )
}
