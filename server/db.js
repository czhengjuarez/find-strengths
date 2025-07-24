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
  await db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      capability TEXT NOT NULL
    );
  `);
  return db;
}
