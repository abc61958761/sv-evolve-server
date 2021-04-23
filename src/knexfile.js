import logger from './utils/logger';

require('dotenv').config({ path: __dirname + '/../.env' });

// Default configuration for database connection
let connection = {
  port: process.env.DB_PORT,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8',
  timezone: 'UTC'
};

// For test environment
if (process.env.NODE_ENV === 'test') {
  connection = {
    ...connection,
    port: process.env.TEST_DB_PORT,
    host: process.env.TEST_DB_HOST,
    user: process.env.TEST_DB_USER,
    password: process.env.TEST_DB_PASSWORD,
    database: process.env.TEST_DB_NAME
  };
}
logger.info(`NODE_ENV: ${process.env.NODE_ENV}`);
logger.info(`DATABASE_URL: ${process.env.DATABASE_URL}`);

if (process.env.NODE_ENV === 'production') {
  connection = {
    ...connection,
    ssl: { rejectUnauthorized: false }
  };
}
logger.info(`host : ${connection.host}`);
logger.info(`port : ${connection.port}`);

/**
 * Database configuration.
 */
module.exports = {
  connection,
  // client: process.env.DB_CLIENT,
  client: 'pg',
  migrations: {
    tableName: 'migrations',
    directory: './migrations',
    stub: './stubs/migration.stub'
  },
  seeds: {
    directory: './seeds',
    stub: './stubs/seed.stub'
  }
};
