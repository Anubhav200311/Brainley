import { Pool, PoolConfig } from 'pg';

interface DatabaseConfig extends PoolConfig {
  ssl?: { rejectUnauthorized: boolean };
}

class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    this.pool = this.initializePool();
    this.testConnection().catch(err => {
      console.error('Critical database connection error:', err);
      process.exit(1);
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  private initializePool(): Pool {
    if (process.env.DATABASE_URL) {
      console.log('Using Railway database connection');
      return new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 10, // Adjust based on your needs
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
      });
    }

    const localConfig: DatabaseConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'brainley',
      max: 5,
      idleTimeoutMillis: 30000
    };

    console.log('Connecting to database with config:', {
      ...localConfig,
      password: '********'
    });

    return new Pool(localConfig);
  }

  private async testConnection(maxAttempts = 5, baseDelay = 1000): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const client = await this.pool.connect();
        try {
          const res = await client.query('SELECT NOW()');
          console.log('✅ Database connected successfully:', res.rows[0]);
          return;
        } finally {
          client.release();
        }
      } catch (err) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.error(`❌ Connection attempt ${attempt} failed (retrying in ${delay}ms):`, 
          err instanceof Error ? err.message : err);
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Failed to connect to database after ${maxAttempts} attempts`);
  }

  public async close(): Promise<void> {
    await this.pool.end();
    console.log('Database pool closed');
  }
}

// Singleton instance
const database = Database.getInstance();
const pool = database.getPool();

// Cleanup on process termination
['SIGTERM', 'SIGINT'].forEach(signal => {
  process.on(signal, async () => {
    console.log(`${signal} received - closing database pool`);
    await database.close();
    process.exit(0);
  });
});

export default pool;