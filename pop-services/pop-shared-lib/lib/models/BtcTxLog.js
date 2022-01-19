const Sequelize = require('sequelize-cockroachdb')

const envalid = require('envalid')

const env = envalid.cleanEnv(process.env, {
  COCKROACH_HOST: envalid.str({ devDefault: 'roach1', desc: 'CockroachDB host or IP' }),
  COCKROACH_PORT: envalid.num({ default: 26257, desc: 'CockroachDB port' }),
  COCKROACH_DB_NAME: envalid.str({ default: 'proof_of_presence', desc: 'CockroachDB name' }),
  COCKROACH_DB_USER: envalid.str({ default: 'proof_of_presence', desc: 'CockroachDB user' }),
  COCKROACH_DB_PASS: envalid.str({ default: '', desc: 'CockroachDB password' }),
  COCKROACH_BTC_TX_LOG_TABLE_NAME: envalid.str({ default: 'proof_of_presence_btc_tx_log', desc: 'CockroachDB table name' }),
  COCKROACH_TLS_CA_CRT: envalid.str({ devDefault: '', desc: 'CockroachDB TLS CA Cert' }),
  COCKROACH_TLS_CLIENT_KEY: envalid.str({ devDefault: '', desc: 'CockroachDB TLS Client Key' }),
  COCKROACH_TLS_CLIENT_CRT: envalid.str({ devDefault: '', desc: 'CockroachDB TLS Client Cert' })
})

// Connect to CockroachDB through Sequelize.
let sequelizeOptions = {
  dialect: 'postgres',
  host: env.COCKROACH_HOST,
  port: env.COCKROACH_PORT,
  logging: false,
  operatorsAliases: false
}

// Present TLS client certificate to production cluster
if (env.isProduction) {
  sequelizeOptions.dialectOptions = {
    ssl: {
      rejectUnauthorized: false,
      ca: env.COCKROACH_TLS_CA_CRT,
      key: env.COCKROACH_TLS_CLIENT_KEY,
      cert: env.COCKROACH_TLS_CLIENT_CRT
    }
  }
}

let sequelize = new Sequelize(env.COCKROACH_DB_NAME, env.COCKROACH_DB_USER, env.COCKROACH_DB_PASS, sequelizeOptions)

// Define the model and the table it will be stored in.
var BtcTxLog = sequelize.define(env.COCKROACH_BTC_TX_LOG_TABLE_NAME,
  {
    txId: {
      comment: 'The bitcoin transaction id hash.',
      primaryKey: true,
      type: Sequelize.STRING,
      validate: {
        is: ['^[a-fA-F0-9:]{1,255}$', 'i']
      },
      field: 'tx_id',
      allowNull: false
    },
    publishDate: {
      comment: 'Transaction publish time in milliseconds since unix epoch',
      type: Sequelize.INTEGER, // is 64 bit in CockroachDB
      validate: {
        isInt: true
      },
      field: 'publish_date',
      allowNull: false,
      unique: true
    },
    rawTx: {
      comment: 'The raw transaction body hex',
      type: Sequelize.TEXT,
      validate: {
        is: ['^([a-f0-9]{2})+$', 'i']
      },
      field: 'raw_tx',
      allowNull: false
    },
    feeSatoshiPerByte: {
      comment: 'The fee expressed in Satoshi per byte',
      type: Sequelize.INTEGER,
      validate: {
        isInt: true
      },
      field: 'fee_satoshi_per_byte',
      allowNull: false
    },
    feePaidSatoshi: {
      comment: 'The final fee paid for this transaction expressed in Satoshi',
      type: Sequelize.INTEGER,
      validate: {
        isInt: true
      },
      field: 'fee_paid_satoshi',
      allowNull: false
    },
    stackId: {
      comment: 'The unique identifier for the stack in which this service runs',
      type: Sequelize.STRING,
      field: 'stack_id',
      allowNull: false
    }
  },
  {
    // No automatic timestamp fields, we add our own 'timestamp' so it is
    // known prior to save so it can be included in the block signature.
    timestamps: false,
    // Disable the modification of table names; By default, sequelize will automatically
    // transform all passed model names (first parameter of define) into plural.
    // if you don't want that, set the following
    freezeTableName: true
  }
)

module.exports = {
  sequelize: sequelize,
  BtcTxLog: BtcTxLog
}
