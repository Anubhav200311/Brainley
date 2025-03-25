import { Pool } from 'pg';

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: { rejectUnauthorized: boolean };
}

let pool: Pool;

// Initialize database connection pool
function initializePool() {
  if (process.env.DATABASE_URL) {
    // Railway production environment
    console.log('Using Railway database connection');
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false // Required for Railway PostgreSQL
      }
    });
  } else {
    // Local development environment
    const localConfig: DatabaseConfig = {
      host: process.env.DB_HOST || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'brainley'
    };

    console.log('Connecting to database with config:', {
      ...localConfig,
      password: '********' // Mask password in logs
    });

    return new Pool(localConfig);
  }
}

pool = initializePool();

// Test database connection with exponential backoff retries
async function testConnection(maxAttempts = 5, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await pool.query('SELECT NOW()');
      console.log('✅ Database connected successfully:', res.rows[0]);
      return true;
    } catch (err) {
      const delay = baseDelay * Math.pow(2, attempt - 1);
      if (err instanceof Error) {
        console.error(`❌ Connection attempt ${attempt} failed (retrying in ${delay}ms):`, err.message);
      } else {
        console.error(`❌ Connection attempt ${attempt} failed (retrying in ${delay}ms):`, err);
      }
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error(`❌ Failed to connect to database after ${maxAttempts} attempts`);
  throw new Error('Database connection failed');
}

// Immediately test connection when module loads
testConnection().catch(err => {
  console.error('Critical database connection error:', err);
  process.exit(1); // Exit if we can't connect to database
});

// Cleanup on process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received - closing database pool');
  pool.end().then(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

export default pool;