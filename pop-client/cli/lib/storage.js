const NeDB = require('nedb')
const fs = require('fs')
const untildify = require('untildify')
const DATA_DIR = '~/.pop'
const DATA_FILENAME = 'pop-proofs.db'
const bluebird = require('bluebird')

async function connectAsync () {
  // Ensure that the target directory exists
  if (!fs.existsSync(untildify(DATA_DIR))) {
    fs.mkdirSync(untildify(DATA_DIR))
  }

  let pathToDataFile = untildify(`${DATA_DIR}/${DATA_FILENAME}`)

  let hashDb = new NeDB({
    filename: pathToDataFile,
    timestampData: true,
    corruptAlertThreshold: 0
  })
  bluebird.promisifyAll(hashDb)

  await hashDb.loadDatabaseAsync()

  return hashDb
}

module.exports = {
  connectAsync: connectAsync
}
