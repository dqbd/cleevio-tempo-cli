"use strict"
import React from "react"
import { render } from "ink"
import meow from "meow"
import { App } from './src/components/App'

const cli = meow(`
	Usage
	  $ cleevio-tempo-cli

	Options
		--token  Your Tempo API Token

	Examples
	  $ cleevio-tempo-cli --token=[Token]
`)

render(React.createElement(App, cli.flags), {
	debug: false
})
