import pool from './index';

async function initDatabase() {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      // Create users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(100) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('Database tables initialized');
      return; // Exit if successful
    } catch (error) {
      retries++;
      console.error(`Failed to initialize database tables (attempt ${retries}):`, error);
      if (retries === maxRetries) {
        throw new Error('Max retries reached. Failed to initialize database.');
      }
      // Wait for 5 seconds before retrying
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

export default initDatabase;