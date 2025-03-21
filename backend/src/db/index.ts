import { Pool } from 'pg';

let pool: Pool;

// Check if running on Railway (it provides DATABASE_URL)
if (process.env.DATABASE_URL) {
  console.log('Using Railway database connection');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Railway PostgreSQL
    }
  });
} else {
  // Local development with Docker Compose
  console.log('Connecting to database with params:', {
    host: process.env.DB_HOST || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: '********', // Don't log actual password
    database: process.env.DB_NAME || 'brainley',
  });

  pool = new Pool({
    host: process.env.DB_HOST || 'postgres', 
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'brainley',
  });
}

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