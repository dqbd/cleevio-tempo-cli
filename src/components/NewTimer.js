import React, { useContext } from "react"
import { Text, Box, useInput } from "ink"
import { createTracker } from "../api"
import { TokenContext } from "../context"

export const NewTimer = ({ selected, onCreate }) => {
  const token = useContext(TokenContext)
  const [loading, setLoading] = React.useState(false)

  useInput(async (input, key) => {
    if (key.return && selected) {
      setLoading(true)
      onCreate(await createTracker(token))
      setLoading(false)
    }
  })

  return (
    <Box>
      {selected && !loading && <Text>[+] Create a new timer</Text>}
      {!selected && !loading && <Text>[ ] Create a new timer</Text>}
      {loading && <Text>Creating a new timer...</Text>}
    </Box>
  )
}
