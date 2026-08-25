-- Add deleted_at column to user_profiles for logical deletion
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
