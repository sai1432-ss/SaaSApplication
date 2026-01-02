import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create a connection pool to PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test the connection immediately when the app starts
pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL Database successfully!'))
  .catch((err) => console.error('❌ Database connection error:', err.message));

// Helper function to run queries
export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;
