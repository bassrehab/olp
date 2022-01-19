const envalid = require('envalid')

const validateAggInterval = envalid.makeValidator(x => {
  if (x >= 250 && x <= 10000) return x
  else throw new Error('Value must be between 250 and 10000, inclusive')
})
const validateMaxHashes = envalid.makeValidator(x => {
  if (x >= 100 && x <= 25000) return x
  else throw new Error('Value must be between 100 and 25000, inclusive')
})
const validateMonitorRange = envalid.makeValidator(x => {
  if (x >= 10 && x <= 600) return x
  else throw new Error('Value must be between 10 and 600, inclusive')
})
const validateMinConfirmRange = envalid.makeValidator(x => {
  if (x >= 1 && x <= 16) return x
  else throw new Error('Value must be between 1 and 16, inclusive')
})
const validateFactorOfSixty = envalid.makeValidator(x => {
  if (x > 0 && x <= 20 && 60 % x === 0) return x
  else throw new Error('Value must be a factor of 60, and no greater than 20')
})
const validateFactorOfSixtyUpToSixty = envalid.makeValidator(x => {
  if (x > 0 && x <= 60 && 60 % x === 0) return x
  else throw new Error('Value must be a factor of 60')
})
const validateETHAddress = envalid.makeValidator(x => {
  if (/^0x[0-9a-f]{40}$/i.test(x)) return x.toLowerCase()
  else throw new Error('Value must be a well formatted Ethereum address')
})
const validateETHAddressesCSV = envalid.makeValidator(x => {
  if (/^((0x[0-9a-f]{40})(,(0x[0-9a-f]{40}))*)+$/i.test(x)) return x.toLowerCase()
  else throw new Error('Value must be a comma separated list of well formatted Ethereum addresses')
})

let envDefinitions = {
  // The following variables are exposed by this stack's /config endpoint
  //
  // PROOF_OF_PRESENCE_CORE_BASE_URI: Base URI for this proof_of_presence Core stack of services
  // ANCHOR_BTC: flag for enabling and disabling BTC anchoring
  // ANCHOR_ETH: flag for enabling and disabling ETH anchoring

  // ***********************************************************************
  // * Global variables with default values
  // ***********************************************************************

  // proof_of_presence stack related variables
  NODE_ENV: envalid.str({ default: 'production', desc: 'The type of environment in which the service is running' }),

  // Anchor to external blockchains toggle variables
  // Using string values in place of a Bool due to issues with storing bool values in K8s secrets
  ANCHOR_BTC: envalid.str({ choices: ['enabled', 'disabled'], default: 'disabled', desc: 'String flag for enabling and disabling BTC anchoring' }),
  ANCHOR_ETH: envalid.str({ choices: ['enabled', 'disabled'], default: 'disabled', desc: 'String flag for enabling and disabling ETH anchoring' }),

  // Consul related variables and keys
  CONSUL_HOST: envalid.str({ default: 'consul', desc: 'Consul server host' }),
  CONSUL_PORT: envalid.num({ default: 8500, desc: 'Consul server port' }),
  NIST_KEY: envalid.str({ default: 'service/nist/latest', desc: 'The consul key to write to, watch to receive updated NIST object' }),
  AUDIT_CHALLENGE_RECENT_KEY: envalid.str({ default: 'service/audit/mostrecentrediskey', desc: 'Key used for acquiring most recent audit challenge redis key' }),
  MIN_NODE_VERSION_EXISTING_KEY: envalid.str({ default: 'service/api/minnodeversionexisting', desc: 'Key used for the minimum acceptable Node version for existing registrations and to pass audits' }),
  MIN_NODE_VERSION_NEW_KEY: envalid.str({ default: 'service/api/minnodeversionnew', desc: 'Key used for the minimum acceptable Node version for new registrations' }),
  ENFORCE_PRIVATE_STAKE_KEY: envalid.str({ default: 'service/api/enforceprivatestake', desc: 'Key used to toggle enforcment of the requirement that private Nodes have the minimum acceptable PNT balance' }),
  NODE_AGGREGATION_INTERVAL_SECONDS_KEY: envalid.str({ default: 'service/api/nodeaggintervalseconds', desc: 'The Node Aggregation interval consul key used by nodes to determin how often they submit constructed merkle tree root to core' }),
  PROOF_STORAGE_METHOD_KEY: envalid.str({ default: 'service/proofgen/proofstoragemethod', desc: 'Key used to determine method of proof storage' }),

  NODE_AGGREGATION_INTERVAL_SECONDS_DEFAULT: envalid.num({ default: 5, desc: 'The Node Aggregation interval default value used by nodes to determin how often they submit constructed merkle tree root to core' }),

  // RabbitMQ related variables
  RABBITMQ_CONNECT_URI: envalid.url({ default: 'amqp://proof_of_presence:PROOF_OF_PRESENCE@rabbitmq', desc: 'Connection string w/ credentials for RabbitMQ' }),
  RMQ_WORK_OUT_STATE_QUEUE: envalid.str({ default: 'work.proofstate', desc: 'The queue name for outgoing message to the proof state service' }),
  RMQ_WORK_OUT_CAL_QUEUE: envalid.str({ default: 'work.cal', desc: 'The queue name for outgoing message to the calendar service' }),
  RMQ_WORK_OUT_AGG_QUEUE: envalid.str({ default: 'work.agg', desc: 'The queue name for outgoing message to the aggregator service' }),
  RMQ_WORK_OUT_BTCTX_QUEUE: envalid.str({ default: 'work.btctx', desc: 'The queue name for outgoing message to the btc tx service' }),
  RMQ_WORK_OUT_BTCMON_QUEUE: envalid.str({ default: 'work.btcmon', desc: 'The queue name for outgoing message to the btc mon service' }),
  RMQ_WORK_OUT_GEN_QUEUE: envalid.str({ default: 'work.gen', desc: 'The queue name for outgoing message to the proof gen service' }),
  RMQ_WORK_OUT_API_QUEUE: envalid.str({ default: 'work.api', desc: 'The queue name for outgoing message to the api service' }),
  RMQ_WORK_OUT_TASK_ACC_QUEUE: envalid.str({ default: 'work.taskacc', desc: 'The queue name for outgoing message to the task accumulator service' }),

  // Redis related variables
  REDIS_CONNECT_URIS: envalid.str({ devDefault: 'redis://redis:6379', desc: 'The Redis server connection URI, or a comma seperated list of Sentinel URIs' }),
  BALANCE_CHECK_KEY_PREFIX: envalid.str({ default: 'API:NodeBalance', desc: 'The prefix for the Redis key containing Node balance information' }),

  // Service Specific Variables

  // Aggregator service specific variables
  RMQ_PREFETCH_COUNT_AGG: envalid.num({ default: 0, desc: 'The maximum number of messages sent over the channel that can be awaiting acknowledgement, 0 = no limit' }),
  RMQ_WORK_IN_AGG_QUEUE: envalid.str({ default: 'work.agg', desc: 'The queue name for message consumption originating from the api service' }),
  AGGREGATION_INTERVAL: validateAggInterval({ default: 1000, desc: 'The frequency of the aggregation process, in milliseconds' }),
  HASHES_PER_MERKLE_TREE: validateMaxHashes({ default: 25000, desc: 'The maximum number of hashes to be used when constructing an aggregation tree' }),

  // API service specific variables
  RMQ_PREFETCH_COUNT_API: envalid.num({ default: 0, desc: 'The maximum number of messages sent over the channel that can be awaiting acknowledgement, 0 = no limit' }),
  MAX_BODY_SIZE: envalid.num({ default: 131072, desc: 'Max body size in bytes for incoming requests' }),

  // BTC Mon service specific variables
  RMQ_PREFETCH_COUNT_BTCMON: envalid.num({ default: 0, desc: 'The maximum number of messages sent over the channel that can be awaiting acknowledgement, 0 = no limit' }),
  RMQ_WORK_IN_BTCMON_QUEUE: envalid.str({ default: 'work.btcmon', desc: 'The queue name for message consumption originating from the calendar service' }),
  MONITOR_INTERVAL_SECONDS: validateMonitorRange({ default: 30, desc: 'The frequency that transactions are monitored for new confirmations, in seconds' }),
  MIN_BTC_CONFIRMS: validateMinConfirmRange({ default: 6, desc: 'The number of confirmations needed before the transaction is considered ready for proof delivery' }),

  // BTC Tx service specific variables
  RMQ_PREFETCH_COUNT_BTCTX: envalid.num({ default: 0, desc: 'The maximum number of messages sent over the channel that can be awaiting acknowledgement, 0 = no limit' }),
  RMQ_WORK_IN_BTCTX_QUEUE: envalid.str({ default: 'work.btctx', desc: 'The queue name for message consumption originating from the calendar service' }),
  // This is to safeguard against the service returning a very high value in error
  // and to impose a common sense limit on the highest fee per byte to allow.
  // MAX BTC to spend = AverageTxSizeBytes * BTC_MAX_FEE_SAT_PER_BYTE / 100000000
  // If we are to limit the maximum fee per transaction to 0.0015 BTC, then
  // 0.0015 = 235 * BTC_MAX_FEE_SAT_PER_BYTE / 100000000
  // BTC_MAX_FEE_SAT_PER_BYTE = 0.0015 * 100000000 / 235
  // BTC_MAX_FEE_SAT_PER_BYTE = 635
  BTC_MAX_FEE_SAT_PER_BYTE: envalid.num({ default: 600, desc: 'The maximum feeRateSatPerByte value accepted' }),

  // Calendar service specific variables
  RMQ_PREFETCH_COUNT_CAL: envalid.num({ default: 0, desc: 'The maximum number of messages sent over the channel that can be awaiting acknowledgement, 0 = no limit' }),
  RMQ_WORK_IN_CAL_QUEUE: envalid.str({ default: 'work.cal', desc: 'The queue name for message consumption originating from the aggregator, btc-tx, and btc-mon services' }),
  CALENDAR_LEADER_KEY: envalid.str({ default: 'service/calendar/leader/lock', desc: 'Key used for acquiring calendar process leadership locks' }),

  // NIST beacon service specific variables
  NIST_INTERVAL_MS: envalid.num({ default: 60000, desc: 'The frequency to get latest NIST beacon data, in milliseconds' }),

  // Proof Gen service specific variables
  RMQ_PREFETCH_COUNT_GEN: envalid.num({ default: 0, desc: 'The maximum number of messages sent over the channel that can be awaiting acknowledgement, 0 = no limit' }),
  RMQ_WORK_IN_GEN_QUEUE: envalid.str({ default: 'work.gen', desc: 'The queue name for message consumption originating from the proof state service' }),
  GCP_STORAGE_PROJECTID: envalid.str({ default: 'proof-proxy', desc: 'The project Id for GCP storage' }),
  GCP_STORAGE_BUCKET: envalid.str({ default: 'proof-proxy-core-proofs', desc: 'Name of the Google Cloud Storage Bucket for Core proofs (short term ephemeral).' }),

  // Proof State service specific variables
  RMQ_PREFETCH_COUNT_STATE: envalid.num({ default: 0, desc: 'The maximum number of messages sent over the channel that can be awaiting acknowledgement, 0 = no limit' }),
  RMQ_WORK_IN_STATE_QUEUE: envalid.str({ default: 'work.proofstate', desc: 'The queue name for message consumption originating from the aggregator, calendar, and proof state services' }),
  PRUNE_FREQUENCY_MINUTES: envalid.num({ default: 1, desc: 'The frequency that the proof state and hash tracker log tables have their old, unneeded data pruned, in minutes' }),
  PROOF_STATE_LEADER_KEY: envalid.str({ default: 'service/proofstate/leader/lock', desc: 'Key used for acquiring proof state process leadership locks' }),

  // ETH PNT Listener / PNT TX services specific variables
  ETH_PROVIDER_URI: envalid.url({ default: 'http://ganache:8545', desc: 'URI to the ETH node provider.' }),
  LISTEN_TX_PORT: envalid.num({ default: 8085, desc: 'Port of the ETH provider.' }),
  PNT_TO_CREDIT_RATE: envalid.num({ default: 200, desc: 'Exchange rate for PNT tokens to Credits. Default is give 200 credits for each PNT token.' }),
  ETH_PNT_TX_CONNECT_URI: envalid.url({ default: 'http://eth-token-tx-service:8085', desc: 'The eth-pop-token-tx-service REST connection URI' }),
  ETH_WALLET: envalid.str({ default: '', desc: 'The JSON wallet file. Leave empty to not use a wallet for transactions.' }),
  ETH_WALLET_PASSWORD: envalid.str({ default: '', desc: 'The password to unlock the ETH wallet. Leave blank if no wallet is used.' }),

  // PNT Reward service specific variables
  REWARDS_PER_HOUR: validateFactorOfSixty({ default: 2, desc: 'The number of times per hour to calculate and distribute rewards, defaults to 2, must be a factor of 60, no greater than 20' }),
  MIN_PNT_GRAINS_BALANCE_FOR_REWARD: envalid.num({ default: 500000000000, desc: 'The minimum balance of PNT, in Grains, that an address must contain in order to be eligible for a reward' }),
  REWARDS_LEADER_KEY: envalid.str({ default: 'service/reward/leader/lock', desc: 'Key used for acquiring reward process leadership locks' }),

  // Audit services specific variables
  NEW_AUDIT_CHALLENGES_PER_HOUR: validateFactorOfSixty({ default: 2, desc: 'The number of times per hour to generate new audit challenges, defaults to 2, must be a factor of 60, no greater than 20' }),
  NODE_AUDIT_ROUNDS_PER_HOUR: validateFactorOfSixtyUpToSixty({ default: 2, desc: 'The number of times per hour to perform Node audit rounds, defaults to 60, must be a factor of 60' }),
  AUDIT_PRODUCER_LEADER_KEY: envalid.str({ default: 'service/audit-producer/leader/lock', desc: 'Key used for acquiring audit producer process leadership locks' }),

  // Task accumulator specific variables
  RMQ_PREFETCH_COUNT_TASK_ACC: envalid.num({ default: 0, desc: 'The maximum number of messages sent over the channel that can be awaiting acknowledgement, 0 = no limit' }),
  RMQ_WORK_IN_TASK_ACC_QUEUE: envalid.str({ default: 'work.taskacc', desc: 'The queue name for message consumption originating from the other services' })
}

module.exports = (service) => {
  // Load and validate service specific require variables as needed
  switch (service) {
    case 'api':
      envDefinitions.PROOF_OF_PRESENCE_CORE_BASE_URI = envalid.url({ desc: 'Base URI for this proof_of_presence Core stack of services' })
      envDefinitions.ETH_PNT_LISTEN_ADDRS = validateETHAddressesCSV({ desc: 'The addresses used to listen for incoming PNT transfers.  If more that one, separate by commas.' })
      break
    case 'audit':
      envDefinitions.PROOF_OF_PRESENCE_CORE_BASE_URI = envalid.url({ desc: 'Base URI for this proof_of_presence Core stack of services' })
      break
    case 'cal':
      envDefinitions.PROOF_OF_PRESENCE_CORE_BASE_URI = envalid.url({ desc: 'Base URI for this proof_of_presence Core stack of services' })
      envDefinitions.SIGNING_SECRET_KEY = envalid.str({ desc: 'A Base64 encoded NaCl secret signing key' })
      break
    case 'btc-mon':
      envDefinitions.INSIGHT_API_BASE_URI = envalid.url({ desc: 'The Bitcore Insight-API base URI' })
      break
    case 'btc-tx':
      envDefinitions.PROOF_OF_PRESENCE_CORE_BASE_URI = envalid.url({ desc: 'Base URI for this proof_of_presence Core stack of services' })
      envDefinitions.INSIGHT_API_BASE_URI = envalid.url({ desc: 'The Bitcore Insight-API base URI' })
      envDefinitions.BITCOIN_WIF = envalid.str({ desc: 'The Bitcoin private key WIF used for transaction creation' })
      break
    case 'eth-pop-token-tx':
      envDefinitions.ETH_PNT_SOURCE_WALLET_PK = envalid.str({ desc: 'The private key for the source PNT / ETH wallet' })
      envDefinitions.ETH_ETHERSCAN_API_KEY = envalid.str({ desc: 'API key for Infura service provider' })
      envDefinitions.ETH_INFURA_API_KEY = envalid.str({ desc: 'API key for Etherscan service provider' })
      envDefinitions.ETH_JSON_RPC_URI = envalid.str({ desc: 'The Parity/Geth JSON-RPC URI for the JsonRpc provoider' })
      break
    case 'eth-contracts':
      envDefinitions.ETH_PNT_TOKEN_ADDR = validateETHAddress({ desc: 'The address where the contract is on the blockchain.' })
      break
    case 'eth-pop-token-listener':
      envDefinitions.ETH_PNT_LISTEN_ADDRS = validateETHAddressesCSV({ desc: 'The addresses used to listen for incoming PNT transfers.  If more that one, separate by commas.' })
      envDefinitions.ETH_PNT_TOKEN_ADDR = validateETHAddress({ desc: 'The address where the contract is on the blockchain.' })
      break
    case 'state':
      envDefinitions.PROOF_OF_PRESENCE_CORE_BASE_URI = envalid.url({ desc: 'Base URI for this proof_of_presence Core stack of services' })
      break
    case 'task-handler':
      envDefinitions.SIGNING_SECRET_KEY = envalid.str({ desc: 'A Base64 encoded NaCl secret signing key' })
      envDefinitions.CORE_PROOF_POLLER_URL = envalid.str({ default: 'https://us-east1-proof_of_presence-services.cloudfunctions.net/PROOF_OF_PRESENCE-monitor-coreproof-poller', desc: 'Endpoint to core proof poller that is part of proof_of_presence-monitor service' })
      break
    case 'token-reward':
      envDefinitions.PROOF_OF_PRESENCE_CORE_BASE_URI = envalid.url({ desc: 'Base URI for this proof_of_presence Core stack of services' })
      envDefinitions.CORE_REWARD_ETH_ADDR = validateETHAddress({ desc: 'A valid Ethereum address that the Core may receive Core rewards with' })
      envDefinitions.CORE_REWARD_ELIGIBLE = envalid.bool({ desc: 'Boolean indicating if this Core may receive Core PNT rewards' })
      break
  }
  return envalid.cleanEnv(process.env, envDefinitions, {
    strict: true
  })
}
