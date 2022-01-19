const uuidValidate = require('uuid-validate')
const uuidTime = require('uuid-time')
const fs = require('fs')
const cpb = require('pop-binary')
const chpSchema = require('pop-proof-json-schema')
const jmespath = require('jmespath')
const validUrl = require('valid-url')
const untildify = require('untildify')

function parseAnchorsComplete (proofObject) {
  let anchorsComplete = ['cal'].concat(jmespath.search(proofObject, '[branches[].branches[].ops[].anchors[].type] | [0]'))
  return anchorsComplete
}

function isValidUrl (url) {
  return (url && validUrl.isWebUri(url))
}

function hashIsValid (hash) {
  return /^([a-fA-F0-9]{2}){20,64}$/.test(hash)
}

function hashIdIsValid (hashId) {
  return uuidValidate(hashId, 1)
}

function hashIdExpired (expMinutes, hashId) {
  let uuidEpoch = parseInt(uuidTime.v1(hashId))
  var nowEpoch = new Date().getTime()
  let uuidDiff = nowEpoch - uuidEpoch
  let maxDiff = expMinutes * 60 * 1000
  return (uuidDiff > maxDiff)
}

function getHashIdTime (hashId) {
  return parseInt(uuidTime.v1(hashId))
}

function fileExists (path) {
  return fs.existsSync(path)
}

function readFile (path, asBinary) {
  if (!fileExists(path)) return false
  let contents = null
  try {
    contents = fs.readFileSync(path, { encoding: asBinary ? null : 'utf8' })
  } catch (err) {
    console.error(err)
    return false
  }
  return contents
}

function writeFile (path, contents) {
  try {
    fs.writeFileSync(path, contents)
  } catch (err) {
    return false
  }
  return true
}

function readProofObject (proofFileData, asBinary) {
  let proofObject = null
  // test if data is a Buffer containing a proof in binary form
  if (asBinary) {
    try {
      proofObject = cpb.binaryToObjectSync(proofFileData)
    } catch (err) { }
    if (proofObject) return proofObject
    return null
  } else {
    // test if data is a JSON string
    let validProofObject = false
    try {
      proofObject = JSON.parse(proofFileData)
      validProofObject = chpSchema.validate(proofObject).valid
    } catch (err) { }
    if (validProofObject) return proofObject
  }

  return null
}

function deleteOldConfig () {
  let oldConfigPath = untildify('~/.pop/cli.config')
  let exists = fileExists(oldConfigPath)
  if (exists) {
    try {
      fs.unlinkSync(oldConfigPath)
    } catch (error) {
      console.log(error.message)
    }
  }
}

/**
 * Checks if param is a function
 *
 * @param {string} parm - The param to check
 * @returns {bool} true if value is a function, otherwise false
 */
function isFunction (param) {
  if (typeof param === 'function') {
    return true
  }
}

module.exports = {
  parseAnchorsComplete: parseAnchorsComplete,
  hashIsValid: hashIsValid,
  hashIdIsValid: hashIdIsValid,
  hashIdExpired: hashIdExpired,
  fileExists: fileExists,
  readFile: readFile,
  writeFile: writeFile,
  readProofObject: readProofObject,
  getHashIdTime: getHashIdTime,
  isValidUrl: isValidUrl,
  deleteOldConfig: deleteOldConfig,
  isFunction: isFunction
}