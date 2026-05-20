-- Wizard / photo polish fields

ALTER TABLE delivery_posts
  ADD COLUMN IF NOT EXISTS stock_number TEXT,
  ADD COLUMN IF NOT EXISTS vin_last6 TEXT,
  ADD COLUMN IF NOT EXISTS cover_photo_id UUID;

ALTER TABLE delivery_post_photos
  ADD COLUMN IF NOT EXISTS original_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS original_public_url TEXT,
  ADD COLUMN IF NOT EXISTS plate_protected BOOLEAN NOT NULL DEFAULT FALSE;
