import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Open a database connection
export async function openDb() {
  return open({
    filename: './community.db',
    driver: sqlite3.Database
  });
}

export async function initDb() {
  const db = await openDb();
  
  // Create entries table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      capability TEXT NOT NULL
    );
  `);
  
  // Create users table for authentication
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT,
      google_id TEXT UNIQUE,
      picture TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Create user_entries table for personal lists
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
  `);
  
  return db;
}
