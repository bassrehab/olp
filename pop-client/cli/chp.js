#!/usr/bin/env node
const semver = require('semver')
const currentVersion = process.version
let runningValidVersion = semver.gt(currentVersion, '0.0.1')
if (!runningValidVersion) {
  console.error(`PoP CLI requires Node v0.0.1 or higher, ${currentVersion} is currently in use`)
  process.exit(1)
}

const cli = require('./cli.js')

// start the whole show
cli.startAsync()
