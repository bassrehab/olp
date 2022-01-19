const env = require('../parse-env.js')('eth-pop-token-provider')
const Wallet = require('ethereumjs-wallet')
const Web3 = require('web3')
const ProviderEngine = require('web3-provider-engine')
const WalletSubprovider = require('web3-provider-engine/subproviders/wallet.js')
const ProviderSubprovider = require('web3-provider-engine/subproviders/provider.js')

module.exports = (providerUri) => {
  // Load the env var to figure out which node to connect to
  if (!providerUri) {
    console.error('ETH_PROVIDER_URI environment variable not set - Exiting...')
    process.exit(-1)
  }

  console.log('providerUri: ', providerUri)

  // Check to see if a wallet is being used
  if (env.ETH_WALLET && env.ETH_WALLET !== '') {
    if (!env.ETH_WALLET_PASSWORD || env.ETH_WALLET_PASSWORD === '') {
      console.error('ETH_WALLET_PASSWORD environment variable is not set - See README - Exiting...')
      process.exit(-1)
    }

    if (!env.ETH_WALLET || env.ETH_WALLET === '') {
      console.error('ETH_WALLET is empty - See README - Exiting...')
      process.exit(-1)
    }

    // console.log('env.ETH_WALLET: ', env.ETH_WALLET)

    let wallet = Wallet.fromV3(JSON.parse(env.ETH_WALLET), env.ETH_WALLET_PASSWORD)

    console.log('Using wallet with provider: ' + providerUri)

    var engine = new ProviderEngine()
    engine.addProvider(new WalletSubprovider(wallet, {}))
    engine.addProvider(new ProviderSubprovider(new Web3.providers.HttpProvider(providerUri)))
    engine.start() // Required by the provider engine.
    return engine
  }

  console.log('Using wallet without provider: ' + providerUri)
  return new Web3.providers.HttpProvider(providerUri)
}
