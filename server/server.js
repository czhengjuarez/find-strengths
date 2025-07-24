import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { openDb, initDb } from './db.js';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

// Initialize DB
initDb();

// Get all entries
app.get('/api/entries', async (req, res) => {
  const db = await openDb();
  const entries = await db.all('SELECT * FROM entries ORDER BY id DESC');
  res.json(entries);
});

// Add a new entry
app.post('/api/entries', async (req, res) => {
  const { category, capability } = req.body;
  if (!category || !capability) {
    return res.status(400).json({ error: 'Category and capability are required' });
  }
  const db = await openDb();
  const result = await db.run(
    'INSERT INTO entries (category, capability) VALUES (?, ?)',
    [category, capability]
  );
  const entry = await db.get('SELECT * FROM entries WHERE id = ?', [result.lastID]);
  res.status(201).json(entry);
});

// Delete an entry
app.delete('/api/entries/:id', async (req, res) => {
  const id = req.params.id;
  const db = await openDb();
  await db.run('DELETE FROM entries WHERE id = ?', [id]);
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
