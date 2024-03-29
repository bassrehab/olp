#!/usr/bin/env node
const utils = require('./lib/utils')
const _ = require('lodash')
const getStdin = require('get-stdin')
const yargs = require('yargs')
const chp = require('pop-client')

async function parseBaseUriAsync (baseUri) {
  // if the value supplied in --server or in pop-cli.config is invalid, exit
  if (!utils.isValidUrl(baseUri)) {
    console.error(`Invalid server - ${baseUri}`)
    process.exit(1)
  }
  // if no value was specified in --server or in pop-cli.config, get random uri
  // http://0.0.0.0 is the env default, and represents a null setting
  if (baseUri === 'http://0.0.0.0') {
    try {
      let nodeBaseURIs = await chp.getNodes(3)
      return nodeBaseURIs
    } catch (error) {
      console.error(error.message)
      process.exit(1)
    }
  }
  // otherwise, return the valid value supplied with --server or in pop-cli.config as a one element array
  return [baseUri]
}

async function startAsync () {
  // load environment variables and commands
  const env = require('./lib/parse-env.js')
  const submitCmd = require('./lib/submit.js')
  const updateCmd = require('./lib/update.js')
  const verifyCmd = require('./lib/verify.js')
  const evaluateCmd = require('./lib/evaluate.js')
  const exportCmd = require('./lib/export.js')
  const listCmd = require('./lib/list.js')
  const showCmd = require('./lib/show.js')
  const deleteCmd = require('./lib/delete.js')
  const versionCmd = require('./lib/version.js')

  // remove old cli.config file if it exists
  utils.deleteOldConfig()

  async function processArgsAsync () {
    let input
    try {
      let inputItems = []
      input = await getStdin()
      if (input) {
        inputItems = input.trim().split(' ')
        yargs.parse(inputItems)
      }
    } catch (error) {
      yargs.showHelp()
      console.error(`Error reading from stdin: ${input}`)
    }

    let argv = yargs
      .usage('Usage: ' + require.main.filename.split('/').pop().slice(0, -3) + ' <command> [options] <argument>')
      .option('s', {
        alias: 'server',
        requiresArg: true,
        default: env.POP_NODE_API_BASE_URI,
        description: 'specify server to use',
        type: 'string'
      })
      .option('q', {
        alias: 'quiet',
        demandOption: false,
        requiresArg: false,
        description: 'suppress all non-error output',
        type: 'boolean'
      })
      .option('j', {
        alias: 'json',
        demandOption: false,
        requiresArg: false,
        description: 'format all output as json',
        type: 'boolean'
      })
      .command('submit', 'submit a hash to be anchored (3x Nodes default)', async (yargs) => {
        let argv = yargs
          .usage('Usage: submit [options] (<hash> <hash>... | <hash>,<hash>,... )')
          .string('_')
          .argv
        argv.server = await parseBaseUriAsync(argv.server)
        submitCmd.executeAsync(yargs, argv)
      })
      .command('update', 'retrieve an updated proof for your hash(es), if available', async (yargs) => {
        let argv = yargs
          .usage('Usage: update [options] <hash_id_node>')
          .option('a', {
            alias: 'all',
            demandOption: false,
            requiresArg: false,
            description: 'process all items in local database',
            type: 'boolean'
          })
          .argv
        updateCmd.executeAsync(yargs, argv)
      })
      .command('verify', 'verify a proof\'s anchor claims', async (yargs) => {
        let argv = yargs
          .usage('Usage: verify [options] <hash_id_node>')
          .option('a', {
            alias: 'all',
            demandOption: false,
            requiresArg: false,
            description: 'process all items in local database',
            type: 'boolean'
          })
          .argv
        argv.server = await parseBaseUriAsync(argv.server)
        verifyCmd.executeAsync(yargs, argv)
      })
      .command('evaluate', 'evaluate and display a proof\'s anchor claims', async (yargs) => {
        let argv = yargs
          .usage('Usage: evaluate [options] <hash_id_node>')
          .option('a', {
            alias: 'all',
            demandOption: false,
            requiresArg: false,
            description: 'process all items in local database',
            type: 'boolean'
          })
          .argv
        argv.server = await parseBaseUriAsync(argv.server)
        evaluateCmd.executeAsync(yargs, argv)
      })
      .command('export', 'export a proof', async (yargs) => {
        let argv = yargs
          .usage('Usage: export [options] <hash_id_node>')
          .option('b', {
            alias: 'binary',
            demandOption: false,
            requiresArg: false,
            description: 'use binary format',
            type: 'boolean'
          })
          .argv
        argv.server = await parseBaseUriAsync(argv.server)
        exportCmd.executeAsync(yargs, argv)
      })
      .command('list', 'display the status of every hash in the local database', (yargs) => {
        let argv = yargs
          .usage('Usage: list')
          .argv
        listCmd.executeAsync(yargs, argv)
      })
      .command('show', 'show the proof for a hash_id_node', (yargs) => {
        let argv = yargs
          .usage('Usage: show [hash_id_node]')
          .argv
        showCmd.executeAsync(yargs, argv)
      })
      .command('delete', 'delete a hash from the local database', (yargs) => {
        let argv = yargs
          .usage('Usage: delete <hash_id_node>')
          .argv
        deleteCmd.executeAsync(yargs, argv)
      })
      .command('version', 'show the CLI version', (yargs) => {
        let argv = yargs
          .usage('Usage: version')
          .argv
        versionCmd.executeAsync(yargs, argv)
      })
      .demandCommand(1, 'You must specify a command.')
      .help('help', 'show help')
      .argv

    // parse cli command and display error message on bad or missing command
    parseCommand(yargs, argv)
  }

  function parseCommand (yargs, argv) {
    if (argv._.length < 1) {
      yargs.showHelp()
    } else {
      // check for unknown command
      let command = _.lowerCase(argv._[0])
      if (_.indexOf(['submit', 'update', 'verify', 'evaluate', 'export', 'list', 'show', 'delete', 'version'], command) < 0) {
        yargs.showHelp()
        console.error(`Unknown command: ${command}`)
      }
    }
  }

  // parse and process the command
  processArgsAsync()
}

module.exports = {
  startAsync: startAsync
}
