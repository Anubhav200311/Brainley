import pool from './index';

async function initDatabase() {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      // Create users table - FIXED EXTRA COMMA
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(100) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Create notes table with foreign key to users - FIXED TABLE NAME TO MATCH ROUTES
      await pool.query(`
        CREATE TABLE IF NOT EXISTS contents (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          link TEXT NOT NULL,
          content_type VARCHAR(50) CHECK (content_type IN ('image', 'video', 'article', 'audio')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          user_id INTEGER NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS content_shares (
          id SERIAL PRIMARY KEY,
          content_id INTEGER NOT NULL,
          share_token VARCHAR(64) UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP WITH TIME ZONE,
          FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
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

export function generateShareToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

export default initDatabase;