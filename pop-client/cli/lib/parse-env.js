const envalid = require('envalid')
const config = require('./config.js')

let envDefinitions = {

  // ***********************************************************************
  // * Global variables with default values
  // ***********************************************************************

  // PoP service location
  CHAINPOINT_NODE_API_BASE_URI: envalid.url({ default: 'http://0.0.0.0', desc: 'Base URI for the PoP Node instance to consume' })

}

module.exports = envalid.cleanEnv(process.env, envDefinitions, {
  strict: true,
  dotEnvPath: config.pathToConfigFile
})
