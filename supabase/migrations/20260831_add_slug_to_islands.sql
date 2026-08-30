-- Migration: Add slug column to islands table
ALTER TABLE islands ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create an index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_islands_slug ON islands(slug);
