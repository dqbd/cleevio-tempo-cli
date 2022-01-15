import { createContext } from "react"
import { Config } from "types"
export const TokenContext = createContext<Config>({
  password: "",
  username: "",
  token: "",
})
