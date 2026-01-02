// File: db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  // Force it to use the environment variable, or the service name 'database'
  host: process.env.DB_HOST || 'database', 
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'saas_db',
  port: process.env.DB_PORT || 5432,
});

module.exports = pool;
