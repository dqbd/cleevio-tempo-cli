import React, { useState } from "react"
import { Text, Box } from "ink"
import Spinner from "ink-spinner"

import { Input } from "../components/Input"
import { getJiraMyself, getTrackers } from "../api"
import { Config } from "types"

enum Steps {
  TEMPO,
  JIRA_USERNAME,
  JIRA_PASSWORD,
}

function LoginPrompt(props: {
  description?: string
  link?: string
  onSubmit: (value: string) => void
}) {
  const [state, setState] = useState<"loading" | "error" | null>(null)
  const [value, setValue] = useState("")

  const handleChange = (value: string) => {
    if (state !== "loading") {
      setValue(value)
    }
  }

  const handleSubmit = async () => {
    const input = value.trim()
    if (input) {
      setState("loading")
      try {
        await props.onSubmit(input)
      } catch (err) {
        console.log(err)
        setValue("")
        setState("error")
      }
    }
  }

  return (
    <Box flexDirection="column">
      {props.description && <Text color="gray">{props.description}</Text>}
      {props.link && <Text color="blue">{props.link}</Text>}
      {state === "loading" && (
        <Text>
          <Spinner type="dots" /> Logging in
        </Text>
      )}
      {state !== "loading" && (
        <Box>
          <Text>
            {state !== "error" ? "Token key:" : "Login failed, try again:"}
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

export const Login = (props: { onConfig: (config: Config) => void }) => {
  const [state, setState] = useState(Steps.TEMPO)

  const [config, setConfig] = useState<Partial<Config>>({})

  return (
    <>
      {state === Steps.TEMPO && (
        <LoginPrompt
          key={Steps.TEMPO}
          link="https://cleevio.atlassian.net/plugins/servlet/ac/io.tempo.jira/tempo-app#!/configuration/api-integration"
          description="Please enter your Tempo token"
          onSubmit={async (token) => {
            await getTrackers({ token, username: "", password: "" })
            setConfig((config) => ({ ...config, token: token }))
            setState(Steps.JIRA_USERNAME)
          }}
        />
      )}

      {state === Steps.JIRA_USERNAME && (
        <LoginPrompt
          key={Steps.JIRA_USERNAME}
          description="Please enter your Jira username"
          onSubmit={(username) => {
            setConfig((config) => ({ ...config, username }))
            setState(Steps.JIRA_PASSWORD)
          }}
        />
      )}

      {state === Steps.JIRA_PASSWORD && (
        <LoginPrompt
          key={Steps.JIRA_PASSWORD}
          description="Please enter your Jira API key"
          link="https://id.atlassian.com/manage-profile/security/api-tokens"
          onSubmit={async (password) => {
            if (!config.username) throw new Error("Username not found")
            if (!config.token) throw new Error("Tempo API token not found")

            const newConfig = {
              token: config.token,
              username: config.username,
              password,
            }
            await getJiraMyself(newConfig)
            props.onConfig(newConfig)
          }}
        />
      )}
    </>
  )
}
