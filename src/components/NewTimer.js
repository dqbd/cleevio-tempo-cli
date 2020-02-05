import React, { useContext } from "react"
import { Text, Box } from "ink"
import { createTracker } from "../api"
import { TokenContext } from "../context"
import { useActiveInput } from "../hooks"

export const NewTimer = ({ selected, onCreate }) => {
  const token = useContext(TokenContext)
  const [loading, setLoading] = React.useState(false)

  useActiveInput(
    async (_, key) => {
      if (key.return && selected) {
        setLoading(true)
        onCreate(await createTracker(token))
        setLoading(false)
      }
    },
    {
      active: !!selected
    }
  )

  return (
    <Box>
      {selected && !loading && <Text>[+] Create a new timer</Text>}
      {!selected && !loading && <Text>[ ] Create a new timer</Text>}
      {loading && <Text>Creating a new timer...</Text>}
    </Box>
  )
}
