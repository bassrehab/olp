const Sequelize = require('sequelize-cockroachdb')

const envalid = require('envalid')

const env = envalid.cleanEnv(process.env, {
  COCKROACH_HOST: envalid.str({ devDefault: 'roach1', desc: 'CockroachDB host or IP' }),
  COCKROACH_PORT: envalid.num({ default: 26257, desc: 'CockroachDB port' }),
  COCKROACH_DB_NAME: envalid.str({ default: 'proof_of_presence', desc: 'CockroachDB name' }),
  COCKROACH_DB_USER: envalid.str({ default: 'proof_of_presence', desc: 'CockroachDB user' }),
  COCKROACH_DB_PASS: envalid.str({ default: '', desc: 'CockroachDB password' }),
  COCKROACH_REG_CORE_TABLE_NAME: envalid.str({ default: 'proof_of_presence_registered_cores', desc: 'CockroachDB table name' }),
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

var RegisteredCore = sequelize.define(env.COCKROACH_REG_CORE_TABLE_NAME,
  {
    stackId: {
      comment: 'The proof_of_presence stack identifier. Should be the domain or IP of the API. e.g. a.proof_of_presence.org',
      type: Sequelize.STRING,
      field: 'stack_id',
      allowNull: false,
      primaryKey: true
    },
    tokenAddr: {
      comment: 'A seemingly valid Ethereum address that the Core may receive Core rewards with.',
      type: Sequelize.STRING,
      validate: {
        is: ['^0x[0-9a-f]{40}$']
      },
      field: 'token_addr',
      allowNull: true
    },
    rewardEligible: {
      comment: 'Boolean indicating if the Core is eligible to receive Core rewards.',
      type: Sequelize.BOOLEAN,
      field: 'reward_eligible',
      allowNull: false
    }
  },
  {
    // Disable the modification of table names; By default, sequelize will automatically
    // transform all passed model names (first parameter of define) into plural.
    // if you don't want that, set the following
    freezeTableName: true,
    // enable timestamps
    timestamps: true,
    // don't use camelcase for automatically added attributes but underscore style
    // so updatedAt will be updated_at
    underscored: true
  }
)

module.exports = {
  sequelize: sequelize,
  RegisteredCore: RegisteredCore
}
