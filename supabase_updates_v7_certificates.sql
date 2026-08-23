-- Add type column to certificates table if it doesn't exist
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'high_quality';

-- Update existing certificates to high_quality
UPDATE certificates SET type = 'high_quality' WHERE type IS NULL;
