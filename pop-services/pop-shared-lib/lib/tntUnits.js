/**
 * env required for token to credit rate
 */
const env = require('./parse-env.js')()
const BigNumber = require('bignumber.js')

/**
 * Format PNT Amount for Token Transfer
 * @return {number}
 */
function tokenToGrains (tokenAmount) {
  return new BigNumber(tokenAmount).times(10 ** 8).toNumber()
}

/**
 * Format PNT Amount from Token Transfer
 * @return {number}
 */
function grainsToPNT (grainsAmount) {
  return new BigNumber(grainsAmount).dividedBy(10 ** 8).toNumber()
}

/**
 * Format PNT Amount from Token Transfer to PNT Credit
 * @return {number}
 */
function grainsToCredits (grainsAmount) {
  return new BigNumber(grainsAmount).times(env.PNT_TO_CREDIT_RATE).dividedBy(10 ** 8).toNumber()
}

module.exports = {
  tokenToGrains: tokenToGrains,
  grainsToPNT: grainsToPNT,
  grainsToCredits: grainsToCredits
}
