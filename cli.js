#!/usr/bin/env node
'use strict';
const React = require('react');
const importJsx = require('import-jsx');
const {render} = require('ink');
const meow = require('meow');

const ui = importJsx('./ui.jsx');

const cli = meow(`
	Usage
	  $ cleevio-tempo-cli

	Options
		--token  Your Tempo API Token

	Examples
	  $ cleevio-tempo-cli --token=[Token]
`);

render(React.createElement(ui, cli.flags), { 
	debug: false,
});
