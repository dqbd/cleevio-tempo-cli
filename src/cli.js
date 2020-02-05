"use strict"
import React from "react"
import { render } from "ink"
import meow from "meow"
import { App } from './components/App'

const cli = meow(`
  Usage
    $ cleevio-tempo-cli

  Options
    --token  Your Tempo API Token
    --debug  Toggle debug mode

  Examples
    $ cleevio-tempo-cli --token=[Token]
`)

const { waitUntilExit } = render(
  React.createElement(App, cli.flags), {
    debug: cli.flags.debug
  }
)

waitUntilExit().catch(error => {
  console.error(error)
}) 
