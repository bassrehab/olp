const Sequelize = require('sequelize-cockroachdb')

const envalid = require('envalid')

const env = envalid.cleanEnv(process.env, {
  COCKROACH_HOST: envalid.str({ devDefault: 'roach1', desc: 'CockroachDB host or IP' }),
  COCKROACH_PORT: envalid.num({ default: 26257, desc: 'CockroachDB port' }),
  COCKROACH_DB_NAME: envalid.str({ default: 'proof_of_presence', desc: 'CockroachDB name' }),
  COCKROACH_DB_USER: envalid.str({ default: 'proof_of_presence', desc: 'CockroachDB user' }),
  COCKROACH_DB_PASS: envalid.str({ default: '', desc: 'CockroachDB password' }),
  COCKROACH_REG_NODE_TABLE_NAME: envalid.str({ default: 'proof_of_presence_registered_nodes', desc: 'CockroachDB table name' }),
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

var RegisteredNode = sequelize.define(env.COCKROACH_REG_NODE_TABLE_NAME,
  {
    tokenAddr: {
      comment: 'A seemingly valid Ethereum address that the Node will send PNT from, or receive rewards with.',
      type: Sequelize.STRING,
      validate: {
        is: ['^0x[0-9a-f]{40}$']
      },
      field: 'token_addr',
      allowNull: false,
      primaryKey: true
    },
    publicUri: {
      comment: 'The public URI address of a Node, when blank represents a non-public Node.',
      type: Sequelize.STRING,
      validate: {
        isUrl: true
      },
      field: 'public_uri',
      allowNull: true
    },
    hmacKey: {
      comment: 'The HMAC secret for this Node. Needed for Node data updates.',
      type: Sequelize.STRING,
      validate: {
        is: ['^[a-f0-9]{64}$', 'i']
      },
      field: 'hmac_key',
      allowNull: false,
      unique: true
    },
    tokenCredit: {
      comment: 'The balance of token credit they have against their address.',
      type: Sequelize.DOUBLE,
      field: 'token_credit',
      defaultValue: 0
    },
    auditScore: {
      comment: 'The current score for this Node as calculated by the audit processes and used in the reward queue.',
      type: Sequelize.INTEGER,
      field: 'audit_score',
      defaultValue: 0
    },
    passCount: {
      comment: 'The total number of times the Node has passed an audit.',
      type: Sequelize.INTEGER,
      field: 'pass_count',
      defaultValue: 0
    },
    failCount: {
      comment: 'The total number of times the Node has failed an audit.',
      type: Sequelize.INTEGER,
      field: 'fail_count',
      defaultValue: 0
    },
    consecutivePasses: {
      comment: 'The number of consecutive times the Node has passed an audit.',
      type: Sequelize.INTEGER,
      field: 'consecutive_passes',
      defaultValue: 0
    },
    consecutiveFails: {
      comment: 'The number of consecutive times the Node has failed an audit.',
      type: Sequelize.INTEGER,
      field: 'consecutive_fails',
      defaultValue: 0
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
    underscored: true,
    indexes: [
      {
        unique: false,
        fields: ['token_credit']
      },
      {
        unique: false,
        fields: ['public_uri', 'token_addr', { attribute: 'audit_score', order: 'DESC' }, 'created_at']
      },
      {
        unique: false,
        fields: ['consecutive_passes', 'public_uri']
      }
    ]
  }
)

module.exports = {
  sequelize: sequelize,
  RegisteredNode: RegisteredNode
}
