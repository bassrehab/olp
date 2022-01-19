var Web3 = require('web3')
const contract = require('truffle-contract')

module.exports = async (provider, tokenAddr) => {
  // Create the provider
  console.log('Creating web3')
  let web3 = new Web3(provider)

  // Load the token json obj
  console.log('loading PopNetworkToken token')
  let tokenDef = require('../../contracts/PopNetworkToken.json')

  // If the token addr is specified in the environment var, use that as highest priority
  if (tokenAddr && tokenAddr !== '') {
    console.log('Using token addr: ' + tokenAddr)

    // Load the ABI for the contract and initialize a contract interface
    let tokenABI = tokenDef.abi
    let tokenDefinition = web3.eth.contract(tokenABI)

    // Set the actual instance from the address on the blockchain, so we can communicate with it.
    return tokenDefinition.at(tokenAddr)
  }

  // If the env var was not set, see if the token definition has been deployed.
  const token = contract(tokenDef)
  token.setProvider(provider)
  let deployedToken = await token.deployed()

  // Didn't find it there either... bail out
  if (!deployedToken) {
    console.error('PopNetworkToken Token ERC20 Contract Address is not found deployed or set as env var (ETH_PNT_TOKEN_ADDR) - Exiting...')
    process.exit(-1)
  }

  // Dumb workaround for bug - https://github.com/ethereum/web3.js/issues/925
  console.log('Using PNT Token contract at ', deployedToken.address)
  let tokenABI = tokenDef.abi
  let tokenDefinition = web3.eth.contract(tokenABI)
  return tokenDefinition.at(deployedToken.address)
}
