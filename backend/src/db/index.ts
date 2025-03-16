import { Pool } from 'pg';

console.log('Connecting to database with params:', {
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: '********', // Don't log actual password
  database: process.env.DB_NAME || 'brainley',
});

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres', 
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'brainley',
});

// Test database connection with retries
async function testConnection() {
  let connected = false;
  let attempts = 0;
  
  while (!connected && attempts < 10) {
    try {
      const res = await pool.query('SELECT NOW()');
      console.log('Database connected', res.rows[0]);
      connected = true;
    } catch (err) {
      attempts++;
      console.log(`Database connection attempt ${attempts} failed, retrying in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  if (!connected) {
    console.error('Failed to connect to database after multiple attempts');
  }
}

testConnection();

export default pool;