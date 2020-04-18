"use strict"
import React from "react"
import meow from "meow"
import { render } from "ink"
import { App } from "./sections/App"

const cli = meow(
  `
  Usage
    $ cleevio-tempo-cli

  Options
    --debug  Toggle debug mode
    --logout Remove the Tempo Token

  Examples
    $ cleevio-tempo-cli
`,
  {
    flags: {
      logout: {
        type: "boolean",
        default: false,
      },
      debug: {
        type: "boolean",
        default: false,
      },
    },
  }
)

const { waitUntilExit } = render(React.createElement(App, cli.flags), {
  debug: cli.flags.debug,
})

waitUntilExit().catch((error) => {
  console.error(error)
  return Promise.reject(error)
})
