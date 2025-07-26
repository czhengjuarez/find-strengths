import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import dotenv from 'dotenv';
import { openDb, initDb } from './db.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 4000;

// JWT Secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-key-for-local-development-only-change-in-production';

// Google OAuth credentials
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Debug: Log the credentials being used
console.log('Google OAuth Credentials:');
console.log('Client ID:', GOOGLE_CLIENT_ID);
console.log('Client Secret:', GOOGLE_CLIENT_SECRET ? 'GOCSPX-***' : 'NOT SET');

// Config endpoint to provide Google Client ID to frontend
app.get('/auth/config', (req, res) => {
  res.json({
    googleClientId: GOOGLE_CLIENT_ID
  });
});

app.use(cors());
app.use(bodyParser.json());

// Initialize DB
initDb();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper function to generate user ID
const generateUserId = () => {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// === AUTHENTICATION ENDPOINTS ===

// Register new user
app.post('/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }
  
  try {
    const db = await openDb();
    
    // Check if user already exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const userId = generateUserId();
    await db.run(
      'INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)',
      [userId, email, name, passwordHash]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { id: userId, email, name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: { id: userId, email, name }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  try {
    const db = await openDb();
    
    // Find user
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Validate token and get user info
app.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const user = await db.get('SELECT id, email, name, picture FROM users WHERE id = ?', [req.user.id]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Google OAuth callback
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: 'http://localhost:3001/auth/google/callback'
    });
    
    const { access_token } = tokenResponse.data;
    
    // Get user info from Google
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    const { id: googleId, email, name, picture } = userResponse.data;
    
    const db = await openDb();
    
    // Check if user exists
    let user = await db.get('SELECT * FROM users WHERE google_id = ? OR email = ?', [googleId, email]);
    
    if (user) {
      // Update existing user
      await db.run(
        'UPDATE users SET google_id = ?, picture = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [googleId, picture, user.id]
      );
    } else {
      // Create new user
      const userId = generateUserId();
      await db.run(
        'INSERT INTO users (id, email, name, google_id, picture) VALUES (?, ?, ?, ?, ?)',
        [userId, email, name, googleId, picture]
      );
      user = { id: userId, email, name, google_id: googleId, picture };
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Redirect to frontend with token
    res.redirect(`http://localhost:3001?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture
    }))}`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: 'OAuth authentication failed' });
  }
});

// Delete user account and all associated data
app.delete('/auth/delete-account', authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const userId = req.user.id;
    
    // Delete user's personal entries (will cascade due to foreign key)
    await db.run('DELETE FROM user_entries WHERE user_id = ?', [userId]);
    
    // Delete the user account
    await db.run('DELETE FROM users WHERE id = ?', [userId]);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === USER ENTRIES ENDPOINTS ===

// Get user's personal entries
app.get('/entries', authenticateToken, async (req, res) => {
  try {
    const db = await openDb();
    const entries = await db.all(
      'SELECT * FROM user_entries WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(entries);
  } catch (error) {
    console.error('Error fetching user entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add user's personal entry
app.post('/entries', authenticateToken, async (req, res) => {
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }
  
  try {
    const db = await openDb();
    const result = await db.run(
      'INSERT INTO user_entries (user_id, content) VALUES (?, ?)',
      [req.user.id, content]
    );
    
    const entry = await db.get(
      'SELECT * FROM user_entries WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json(entry);
  } catch (error) {
    console.error('Error adding user entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user's personal entry
app.delete('/entries/:id', authenticateToken, async (req, res) => {
  const entryId = req.params.id;
  
  try {
    const db = await openDb();
    
    // Verify the entry belongs to the user
    const entry = await db.get(
      'SELECT * FROM user_entries WHERE id = ? AND user_id = ?',
      [entryId, req.user.id]
    );
    
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found or access denied' });
    }
    
    await db.run('DELETE FROM user_entries WHERE id = ?', [entryId]);
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting user entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user entries for guests (returns empty array)
app.get('/entries/guest', async (req, res) => {
  res.json([]);
});

// === COMMUNITY ENDPOINTS ===

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
