-- Delivery Post Studio — initial schema

-- Enums
CREATE TYPE post_status AS ENUM ('draft', 'ready', 'posted', 'failed');
CREATE TYPE platform_choice AS ENUM ('instagram', 'facebook', 'both');

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'manager', 'admin')),
  dealership_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Delivery posts
CREATE TABLE delivery_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  salesperson_name TEXT NOT NULL,
  vehicle_year INTEGER NOT NULL CHECK (vehicle_year >= 1990 AND vehicle_year <= 2100),
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  trim TEXT,
  colour TEXT,
  story TEXT,
  consent_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  platforms platform_choice NOT NULL DEFAULT 'both',
  status post_status NOT NULL DEFAULT 'draft',
  caption_options JSONB NOT NULL DEFAULT '[]'::JSONB,
  selected_caption_index INTEGER,
  final_caption TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX delivery_posts_created_by_idx ON delivery_posts(created_by);
CREATE INDEX delivery_posts_status_idx ON delivery_posts(status);
CREATE INDEX delivery_posts_created_at_idx ON delivery_posts(created_at DESC);

-- Photos per post
CREATE TABLE delivery_post_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES delivery_posts(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX delivery_post_photos_post_id_idx ON delivery_post_photos(post_id);

-- Connected social accounts (for future Meta integration)
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook')),
  account_name TEXT,
  page_id TEXT,
  access_token_encrypted TEXT,
  is_connected BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (platform, page_id)
);

-- Publish attempt logs
CREATE TABLE post_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES delivery_posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'publish',
  status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'pending')),
  response JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX post_logs_post_id_idx ON post_logs(post_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER delivery_posts_updated_at
  BEFORE UPDATE ON delivery_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER social_accounts_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_post_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users read/update own profile
CREATE POLICY profiles_select_own ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (auth.uid() = id);

-- Delivery posts: authenticated staff CRUD own posts; managers see all (simplified: all authenticated)
CREATE POLICY delivery_posts_select ON delivery_posts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY delivery_posts_insert ON delivery_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY delivery_posts_update ON delivery_posts
  FOR UPDATE TO authenticated USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager', 'admin')
  ));

CREATE POLICY delivery_posts_delete ON delivery_posts
  FOR DELETE TO authenticated USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin')
  ));

-- Photos: via post ownership
CREATE POLICY delivery_post_photos_select ON delivery_post_photos
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM delivery_posts p WHERE p.id = post_id)
  );

CREATE POLICY delivery_post_photos_insert ON delivery_post_photos
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM delivery_posts p WHERE p.id = post_id AND (
      p.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager', 'admin')
      )
    ))
  );

CREATE POLICY delivery_post_photos_update ON delivery_post_photos
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM delivery_posts p WHERE p.id = post_id AND p.created_by = auth.uid())
  );

CREATE POLICY delivery_post_photos_delete ON delivery_post_photos
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM delivery_posts p WHERE p.id = post_id AND p.created_by = auth.uid())
  );

-- Social accounts: read for all staff; write for admin only
CREATE POLICY social_accounts_select ON social_accounts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY social_accounts_admin ON social_accounts
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Post logs: read for authenticated
CREATE POLICY post_logs_select ON post_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY post_logs_insert ON post_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Storage bucket (run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('delivery-photos', 'delivery-photos', true);
