const storage = require('./storage.js')
const BLAKE2s = require('blake2s-js')
const uuidTime = require('uuid-time')
const OutputBuilder = require('./output-builder.js')
const parallel = require('async-await-parallel')
const chp = require('pop-client')

const POST_HASHES_MAX = 250

async function executeAsync (yargs, argv) {
  let output = new OutputBuilder('submit')
  // honor the quiet directive if set
  let quiet = argv.quiet || false
  // honor the json directive if set
  let json = argv.json || false

  // determine API base URI to use
  let baseURIs = argv.server

  let argCount = argv._.length

  let hashes = []
  if (argCount < 2) { // there is no hash parameter
    output.addErrorResult({
      message: `missing hash argument`
    })
    output.display(quiet, json)
  } else if (argCount === 2) { // this is one hash, or a CSV of hashes
    hashes = argv._[1].split(',')
  } else { // this is a list of multiple hashes
    hashes = argv._.splice(1)
  }

  // if there are no valid hashes submitted, abort
  if (hashes.length === 0) return

  // parameters are valid, open storage and process submit
  let hashDb
  try {
    hashDb = await storage.connectAsync()
  } catch (error) {
    for (let x = 0; x < hashes.length; x++) {
      output.addErrorResult({
        hash: hashes[x],
        message: `${error.message}`
      })
    }
    output.display(quiet, json)
    return
  }

  // create submit tasks for each Node to submit to in baseURIs
  let allResults = []
  let submitTasks = []
  for (let x = 0; x < baseURIs.length; x++) {
    let hashSegments = []
    let workingHashSet = hashes.slice()
    while (workingHashSet.length > 0) hashSegments.push(workingHashSet.splice(0, POST_HASHES_MAX))

    for (let y = 0; y < hashSegments.length; y++) {
      submitTasks.push(async () => { return submitHashesAsync(hashDb, hashSegments[y], baseURIs[x]) })
    }
  }

  if (submitTasks.length > 0) {
    try {
      let submitResults = await parallel(submitTasks, 20)
      for (let x = 0; x < submitResults.length; x++) {
        allResults = allResults.concat(submitResults[x])
      }
    } catch (error) {
      console.error(`ERROR : Could not submit hash(es)`)
    }
  }

  for (let x = 0; x < allResults.length; x++) {
    if (allResults[x].success) {
      output.addSuccessResult({
        hash_id_node: allResults[x].hash_id_node,
        hash: allResults[x].hash,
        message: allResults[x].message
      })
    } else {
      output.addErrorResult({
        hash: allResults[x].hash,
        message: allResults[x].message
      })
    }
  }
  output.display(quiet, json)
}

async function submitHashesAsync (hashDb, hashArray, baseURI) {
  let submitResults = []

  let submitResponse
  try {
    submitResponse = await chp.submitHashes(hashArray, [baseURI])
  } catch (error) {
    for (let x = 0; x < hashArray.length; x++) {
      submitResults.push({
        success: false,
        hash: hashArray[x],
        message: error.error.message
      })
    }
    return submitResults
  }

  for (let x = 0; x < submitResponse.length; x++) {
    let hashItem = submitResponse[x]
    let blakeValid = false
    try {
      // validate BLAKE2s
      let hashTimestampMS = parseInt(uuidTime.v1(hashItem.hashIdNode))
      let h = new BLAKE2s(5, { personalization: Buffer.from('CHAINPNT') })
      let hashStr = [
        hashTimestampMS.toString(),
        hashTimestampMS.toString().length,
        hashItem.hash,
        hashItem.hash.length
      ].join(':')
      h.update(Buffer.from(hashStr))
      let expectedData = Buffer.concat([Buffer.from([0x01]), h.digest()]).toString('hex')
      let embeddedData = hashItem.hashIdNode.slice(24)
      if (embeddedData === expectedData) {
        // the BLAKE2 hash has been validated
        blakeValid = true
        await hashDb.insertAsync({
          _id: hashItem.hashIdNode,
          hash: hashItem.hash,
          nodeUri: hashItem.uri
        })
      }
      let submitResult = {}
      submitResult.success = blakeValid
      submitResult.hash_id_node = hashItem.hashIdNode
      submitResult.hash = hashItem.hash
      submitResult.message = blakeValid ? 'submitted' : 'refused, bad blake2 value in uuid from node'
      submitResults.push(submitResult)
    } catch (error) {
      let submitResult = {}
      submitResult.success = false
      submitResult.hash_id_node = hashItem.hashIdNode
      submitResult.hash = hashItem.hash
      submitResult.message = error.message
      submitResults.push(submitResult)
    }
  }

  return submitResults
}

module.exports = {
  executeAsync: executeAsync
}