-- Add user_id column to entries table to associate entries with users
-- NULL user_id means guest/anonymous entries (for backward compatibility)
ALTER TABLE entries ADD COLUMN user_id INTEGER;

-- Create index for faster user-specific queries
CREATE INDEX idx_entries_user_id ON entries(user_id);
