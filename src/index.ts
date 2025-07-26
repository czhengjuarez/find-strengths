import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// --- API ROUTES FIRST ---
app.get('/entries', async (c) => {
  try {
    // Check for user authentication
    const authHeader = c.req.header('Authorization');
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        // Simple JWT decode for user ID (in production, verify signature)
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.userId;
      } catch (e) {
        // Invalid token, treat as guest
      }
    }
    
    let query;
    if (userId) {
      // Return user-specific entries
      query = c.env.DB.prepare('SELECT * FROM entries WHERE user_id = ? ORDER BY created_at DESC').bind(userId);
    } else {
      // Return empty array for guests (no persistent storage)
      return c.json([]);
    }
    
    const { results } = await query.all();
    return c.json(results || []);
  } catch (e) {
    // Optionally log error: console.error(e);
    return c.json([], 200); // Always return an array, even on error
  }
});

app.post('/entries', async (c) => {
  const { content } = await c.req.json();
  if (!content) return c.text('Content is required', 400);
  
  // Check for user authentication
  const authHeader = c.req.header('Authorization');
  let userId = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      // Simple JWT decode for user ID (in production, verify signature)
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.userId;
    } catch (e) {
      // Invalid token, treat as guest
    }
  }
  
  if (!userId) {
    // Don't save entries for guest users
    return c.text('Entry created! (guest mode - not saved)', 201);
  }
  
  // Save entry for logged-in user
  await (c.env as any).DB.prepare('INSERT INTO entries (content, user_id) VALUES (?, ?)').bind(content, userId).run();
  return c.text('Entry created!', 201);
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
  const id = c.req.param('id');
  
  // Check for user authentication
  const authHeader = c.req.header('Authorization');
  let userId = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      // Simple JWT decode for user ID (in production, verify signature)
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.userId;
    } catch (e) {
      // Invalid token, treat as guest
    }
  }
  
  if (!userId) {
    return c.text('Authentication required', 401);
  }
  
  // Only allow users to delete their own entries
  await (c.env as any).DB.prepare('DELETE FROM entries WHERE id = ? AND user_id = ?').bind(id, userId).run();
  return c.text('Entry deleted', 200);
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
app.use('/*', serveStatic({ root: './' }));

export default app