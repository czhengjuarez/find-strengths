import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { sign, verify } from 'hono/jwt'

// Type declarations for Cloudflare Workers
declare global {
  interface D1Database {
    prepare(query: string): D1PreparedStatement;
  }
  interface D1PreparedStatement {
    bind(...values: any[]): D1PreparedStatement;
    first(): Promise<any>;
    all(): Promise<{ results: any[] }>;
    run(): Promise<any>;
  }
}

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

const app = new Hono<{ Bindings: Bindings }>()

// Helper function to generate user ID
function generateUserId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Helper function to hash password
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper function to verify password
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedPassword = await hashPassword(password);
  return hashedPassword === hash;
}

// === AUTHENTICATION ENDPOINTS ===

// Config endpoint to provide Google Client ID to frontend
app.get('/auth/config', async (c) => {
  return c.json({
    googleClientId: c.env.GOOGLE_CLIENT_ID
  });
});

// Register new user
app.post('/auth/register', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    // Check if user already exists
    const existingUser = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (existingUser) {
      return c.json({ error: 'User already exists' }, 400);
    }

    // Hash password and create user
    const userId = generateUserId();
    const passwordHash = await hashPassword(password);
    
    await c.env.DB.prepare(`
      INSERT INTO users (id, email, name, password_hash, created_at, updated_at) 
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(userId, email, name, passwordHash).run();

    // Generate JWT token
    const token = await sign({ userId, email, name }, c.env.JWT_SECRET);
    
    return c.json({
      token,
      user: { id: userId, email, name }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// Login user
app.post('/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Find user
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first() as any;
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Generate JWT token
    const token = await sign({ userId: user.id, email: user.email, name: user.name }, c.env.JWT_SECRET);
    
    return c.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, picture: user.picture }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Google OAuth callback
app.get('/auth/google/callback', async (c) => {
  try {
    const code = c.req.query('code');
    
    if (!code) {
      return c.json({ error: 'Authorization code required' }, 400);
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: c.env.GOOGLE_CLIENT_ID,
        client_secret: c.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${new URL(c.req.url).origin}/auth/google/callback`
      })
    });

    const tokenData = await tokenResponse.json() as any;
    if (!tokenData.access_token) {
      console.error('Google OAuth token error:', tokenData);
      return c.redirect(`${new URL(c.req.url).origin}/?error=oauth_failed`);
    }

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const googleUser = await userResponse.json() as any;
    if (!googleUser.email) {
      return c.redirect(`${new URL(c.req.url).origin}/?error=oauth_failed`);
    }

    // Check if user exists or create new user
    let user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ? OR google_id = ?')
      .bind(googleUser.email, googleUser.id).first() as any;

    if (!user) {
      // Create new user
      const userId = generateUserId();
      await c.env.DB.prepare(`
        INSERT INTO users (id, email, name, google_id, picture, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(userId, googleUser.email, googleUser.name, googleUser.id, googleUser.picture).run();
      
      user = { id: userId, email: googleUser.email, name: googleUser.name, picture: googleUser.picture };
    } else {
      // Update existing user with Google info
      await c.env.DB.prepare(`
        UPDATE users SET google_id = ?, picture = ?, updated_at = datetime('now') 
        WHERE id = ?
      `).bind(googleUser.id, googleUser.picture, user.id).run();
      
      user.picture = googleUser.picture;
    }

    // Generate JWT token
    const token = await sign({ userId: user.id, email: user.email, name: user.name }, c.env.JWT_SECRET);
    
    // Redirect with token and user data
    const redirectUrl = `${new URL(c.req.url).origin}/?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify({ id: user.id, email: user.email, name: user.name, picture: user.picture }))}`;
    return c.redirect(redirectUrl);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return c.redirect(`${new URL(c.req.url).origin}/?error=oauth_failed`);
  }
});

// Verify token endpoint
app.get('/auth/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'No token provided' }, 401);
    }

    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET) as any;
    
    const user = await c.env.DB.prepare('SELECT id, email, name, picture FROM users WHERE id = ?')
      .bind(payload.userId).first();
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

// --- API ROUTES FIRST ---
app.get('/entries', async (c) => {
  try {
    // Check for user authentication
    const authHeader = c.req.header('Authorization');
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        // Properly verify JWT token with secret
        const payload = await verify(token, c.env.JWT_SECRET) as any;
        userId = payload.userId;
      } catch (e) {
        console.error('JWT verification failed in GET /entries:', e);
        return c.json({ error: 'Invalid token' }, 401);
      }
    }
    
    if (!userId) {
      // Return empty array for guests (no persistent storage)
      return c.json([]);
    }
    
    // Return user-specific entries from user_entries table
    const query = c.env.DB.prepare('SELECT * FROM user_entries WHERE user_id = ? ORDER BY created_at DESC').bind(userId);
    const { results } = await query.all();
    return c.json(results || []);
  } catch (e) {
    console.error('Error fetching entries:', e);
    return c.json([], 200); // Always return an array, even on error
  }
});

app.post('/entries', async (c) => {
  try {
    const { content } = await c.req.json();
    if (!content) return c.json({ error: 'Content is required' }, 400);
    
    // Check for user authentication
    const authHeader = c.req.header('Authorization');
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        // Properly verify JWT token with secret
        const payload = await verify(token, c.env.JWT_SECRET) as any;
        userId = payload.userId;
      } catch (e) {
        console.error('JWT verification failed:', e);
        return c.json({ error: 'Invalid token' }, 401);
      }
    }
    
    if (!userId) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    // Save entry for logged-in user to user_entries table
    await c.env.DB.prepare('INSERT INTO user_entries (content, user_id, created_at) VALUES (?, ?, datetime(\'now\'))').bind(content, userId).run();
    return c.json({ message: 'Entry created successfully' }, 201);
  } catch (error) {
    console.error('Error creating entry:', error);
    return c.json({ error: 'Failed to create entry' }, 500);
  }
});

app.post('/community-entries', async (c) => {
  const { category, capability } = await c.req.json();
  if (!category || !capability) return c.text('Category and capability are required', 400);
  await c.env.DB.prepare(
    'INSERT INTO community_entries (category, capability) VALUES (?, ?)'
  ).bind(category, capability).run();
  return c.text('Community entry created!', 201);
});

app.get('/community-entries', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM community_entries ORDER BY created_at DESC').all();
  return c.json(results);
});

// Delete a user entry by id
app.delete('/entries/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    // Check for user authentication
    const authHeader = c.req.header('Authorization');
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        // Properly verify JWT token with secret
        const payload = await verify(token, c.env.JWT_SECRET) as any;
        userId = payload.userId;
      } catch (e) {
        console.error('JWT verification failed in DELETE /entries:', e);
        return c.json({ error: 'Invalid token' }, 401);
      }
    }
    
    if (!userId) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    // Only allow users to delete their own entries from user_entries table
    const result = await c.env.DB.prepare('DELETE FROM user_entries WHERE id = ? AND user_id = ?').bind(id, userId).run();
    
    if (result.changes === 0) {
      return c.json({ error: 'Entry not found or not authorized' }, 404);
    }
    
    return c.json({ message: 'Entry deleted successfully' }, 200);
  } catch (error) {
    console.error('Error deleting entry:', error);
    return c.json({ error: 'Failed to delete entry' }, 500);
  }
});

// Delete a single community entry by id
app.delete('/community-entries/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM community_entries WHERE id = ?').bind(id).run();
  return c.text('Entry deleted', 200);
});

// Delete all community entries in a category
app.delete('/community-entries/category/:category', async (c) => {
  const category = decodeURIComponent(c.req.param('category'));
  await c.env.DB.prepare('DELETE FROM community_entries WHERE category = ?').bind(category).run();
  return c.text('All entries in category deleted', 200);
});

// --- STATIC FILES FOR ALL OTHER ROUTES ---
app.use('/*', serveStatic({ path: './' }));

export default app