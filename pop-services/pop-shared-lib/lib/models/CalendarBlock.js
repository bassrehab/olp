const Sequelize = require('sequelize-cockroachdb')

const envalid = require('envalid')

const env = envalid.cleanEnv(process.env, {
  COCKROACH_HOST: envalid.str({ devDefault: 'roach1', desc: 'CockroachDB host or IP' }),
  COCKROACH_PORT: envalid.num({ default: 26257, desc: 'CockroachDB port' }),
  COCKROACH_DB_NAME: envalid.str({ default: 'proof_of_presence', desc: 'CockroachDB name' }),
  COCKROACH_DB_USER: envalid.str({ default: 'proof_of_presence', desc: 'CockroachDB user' }),
  COCKROACH_DB_PASS: envalid.str({ default: '', desc: 'CockroachDB password' }),
  COCKROACH_CAL_TABLE_NAME: envalid.str({ default: 'proof_of_presence_calendar_blockchain', desc: 'CockroachDB table name' }),
  COCKROACH_TLS_CA_CRT: envalid.str({ devDefault: '', desc: 'CockroachDB TLS CA Cert' }),
  COCKROACH_TLS_CLIENT_KEY: envalid.str({ devDefault: '', desc: 'CockroachDB TLS Client Key' }),
  COCKROACH_TLS_CLIENT_CRT: envalid.str({ devDefault: '', desc: 'CockroachDB TLS Client Cert' })
})

const pg = require('pg')
let pgConfig = {
  user: env.COCKROACH_DB_USER,
  host: env.COCKROACH_HOST,
  database: env.COCKROACH_DB_NAME,
  port: env.COCKROACH_PORT,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
}

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
  pgConfig.ssl = {
    rejectUnauthorized: false,
    ca: env.COCKROACH_TLS_CA_CRT,
    key: env.COCKROACH_TLS_CLIENT_KEY,
    cert: env.COCKROACH_TLS_CLIENT_CRT
  }
}

const pgClientPool = new pg.Pool(pgConfig)

let sequelize = new Sequelize(env.COCKROACH_DB_NAME, env.COCKROACH_DB_USER, env.COCKROACH_DB_PASS, sequelizeOptions)

// Define the model and the table it will be stored in.
// See : Why don't we auto increment primary key automatically:
//   https://www.cockroachlabs.com/docs/serial.html
var CalendarBlock = sequelize.define(env.COCKROACH_CAL_TABLE_NAME,
  {
    id: {
      comment: 'Sequential monotonically incrementing Integer ID representing block height.',
      primaryKey: true,
      type: Sequelize.INTEGER,
      validate: {
        isInt: true
      },
      allowNull: false
    },
    time: {
      comment: 'Block creation time in seconds since unix epoch',
      type: Sequelize.INTEGER,
      validate: {
        isInt: true
      },
      allowNull: false
    },
    version: {
      comment: 'Block version number, for future use.',
      type: Sequelize.INTEGER,
      defaultValue: function () {
        return 1
      },
      validate: {
        isInt: true
      },
      allowNull: false
    },
    stackId: {
      comment: 'The proof_of_presence stack identifier. Should be the domain or IP of the API. e.g. a.proof_of_presence.org',
      type: Sequelize.STRING,
      field: 'stack_id',
      allowNull: false
    },
    type: {
      comment: 'Block type.',
      type: Sequelize.STRING,
      validate: {
        isIn: [['gen', 'cal', 'nist', 'btc-a', 'btc-c', 'eth-a', 'eth-c', 'reward']]
      },
      allowNull: false
    },
    dataId: {
      comment: 'The identifier for the data to be anchored to this block, data identifier meaning is determined by block type.',
      type: Sequelize.STRING,
      validate: {
        is: ['^[a-fA-F0-9:x]{0,255}$', 'i']
      },
      field: 'data_id',
      allowNull: false
    },
    dataVal: {
      comment: 'The data to be anchored to this block, data value meaning is determined by block type.',
      type: Sequelize.STRING,
      validate: {
        is: ['^[a-fA-F0-9:x]{1,255}$', 'i']
      },
      field: 'data_val',
      allowNull: false
    },
    prevHash: {
      comment: 'Block hash of previous block',
      type: Sequelize.STRING,
      validate: {
        is: ['^[a-f0-9]{64}$', 'i']
      },
      field: 'prev_hash',
      allowNull: false,
      unique: true
    },
    hash: {
      comment: 'The block hash, a hex encoded SHA-256 over canonical values',
      type: Sequelize.STRING,
      validate: {
        is: ['^[a-f0-9]{64}$', 'i']
      },
      allowNull: false,
      unique: true
    },
    sig: {
      comment: 'Truncated SHA256 hash of Signing PubKey bytes, colon separated, plus Base64 encoded signature over block hash',
      type: Sequelize.STRING,
      validate: {
        is: ['^[a-zA-Z0-9:=+/]{1,255}$', 'i']
      },
      allowNull: false,
      unique: true
    }
  },
  {
    // No automatic timestamp fields, we add our own 'timestamp' so it is
    // known prior to save so it can be included in the block signature.
    timestamps: false,
    // Disable the modification of table names; By default, sequelize will automatically
    // transform all passed model names (first parameter of define) into plural.
    // if you don't want that, set the following
    freezeTableName: true,
    indexes: [
      {
        unique: true,
        fields: [{ attribute: 'id', order: 'DESC' }, 'hash']
      },
      {
        unique: false,
        fields: ['type', 'data_id']
      },
      {
        unique: false,
        fields: ['type', 'stack_id']
      }
    ]
  }
)

module.exports = {
  sequelize: sequelize,
  CalendarBlock: CalendarBlock,
  pgClientPool: pgClientPool
}
