import React, { useState } from "react"
import { Text, Box } from "ink"
import Spinner from "ink-spinner"

import { Input } from "../components/Input"
import { getTrackers } from "../api"

export const Login = ({ onToken }: { onToken: (token: string) => void }) => {
  const [loading, setLoading] = useState(false)
  const [errors, showErrors] = useState(false)
  const [value, setValue] = useState("")

  const handleChange = (value: string) => {
    !loading && setValue(value)
  }

  const handleSubmit = async () => {
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
  }

  return (
    <Box flexDirection="column">
      <Text color="gray">Please enter your Tempo API Token</Text>
      <Text color="blue">
        https://cleevio.atlassian.net/plugins/servlet/ac/io.tempo.jira/tempo-configuration
      </Text>
      {loading && (
        <Text>
          <Spinner type="dots" /> Logging in
        </Text>
      )}
      {!loading && (
        <Box>
          <Text>
            {!errors && "Token key:"}
            {errors && "Login failed, try again:"}
          </Text>
          <Input
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
