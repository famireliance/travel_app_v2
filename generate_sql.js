const fs = require('fs');
const path = require('path');

// Read the typescript file as text since we can't easily require it without transpilation
const tsFilePath = path.join(__dirname, 'src', 'data', 'allIslandsMaster.ts');
let tsContent = fs.readFileSync(tsFilePath, 'utf-8');

// Extract the dictionary part
const match = tsContent.match(/export const ALL_ISLANDS_MASTER_DICTIONARY: Record<string, any> = ({[\s\S]*});/);
if (!match) {
  console.error("Failed to parse allIslandsMaster.ts");
  process.exit(1);
}

// Safely evaluate the object (since it's just JSON-like data)
let islandsData;
try {
  // Replace true/false with strings temporarily if needed, but it's valid JS.
  const evalString = `(${match[1]})`;
  islandsData = eval(evalString);
} catch (e) {
  console.error("Failed to evaluate JS object", e);
  process.exit(1);
}

const islands = Object.values(islandsData);

let sql = `-- Supabase Migration Script
-- Drops existing tables and creates islands, island_diaries, and admins tables, then inserts 432 islands.

DROP TABLE IF EXISTS public.island_diaries CASCADE;
DROP TABLE IF EXISTS public.islands CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;

CREATE TABLE IF NOT EXISTS public.islands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    region_id TEXT NOT NULL,
    prefecture TEXT NOT NULL,
    coordinates TEXT,
    description TEXT,
    access TEXT,
    area FLOAT,
    radius_m FLOAT,
    checkin_radius_m FLOAT,
    points FLOAT,
    difficulty TEXT,
    is_conquest_target BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT true,
    alert_status TEXT DEFAULT 'normal',
    alert_message TEXT,
    is_featured BOOLEAN DEFAULT false,
    popularity_score INTEGER DEFAULT 0,
    hero_image_url TEXT,
    guide_url TEXT,
    article_url TEXT,
    transport_info TEXT,
    aff_hotel_url TEXT,
    aff_rentacar_url TEXT,
    aff_ferry_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.island_diaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    island_id TEXT REFERENCES public.islands(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    campaign_banner_url TEXT,
    campaign_target_url TEXT,
    campaign_is_active BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    is_banned BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agency_users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    organization_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agency_island_access (
    user_id UUID REFERENCES public.agency_users(id) ON DELETE CASCADE,
    island_id TEXT REFERENCES public.islands(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, island_id)
);

CREATE TABLE IF NOT EXISTS public.ad_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT DEFAULT '',
    subtitle TEXT DEFAULT '',
    sponsor_name TEXT DEFAULT '',
    banner_url TEXT NOT NULL,
    target_url TEXT,
    target_type TEXT NOT NULL,
    target_id TEXT,
    is_active BOOLEAN DEFAULT true,
    weight INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.islands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.island_diaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_island_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

-- Admins are viewable by everyone (or just themselves, but simple for now)
CREATE POLICY "Admins are viewable by everyone" ON public.admins
  FOR SELECT USING (true);

-- Ad campaigns policies
CREATE POLICY "Ad campaigns viewable by everyone" ON public.ad_campaigns FOR SELECT USING (true);
CREATE POLICY "Ad campaigns modifiable by admins" ON public.ad_campaigns FOR ALL USING (auth.uid() IN (SELECT id FROM public.admins));

-- Agency are viewable by everyone
CREATE POLICY "Agency users viewable by everyone" ON public.agency_users
  FOR SELECT USING (true);
CREATE POLICY "Access mappings viewable by everyone" ON public.agency_island_access
  FOR SELECT USING (true);

-- Policies for site_settings
CREATE POLICY "Site settings are viewable by everyone" ON public.site_settings
  FOR SELECT USING (true);
CREATE POLICY "Site settings are updatable by admins only" ON public.site_settings
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM public.admins));

-- Policies for user_profiles
CREATE POLICY "Profiles viewable by admins or self" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id OR auth.uid() IN (SELECT id FROM public.admins));
CREATE POLICY "Profiles updatable by admins" ON public.user_profiles
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM public.admins));

-- Policies for islands
CREATE POLICY "Islands are viewable by everyone" ON public.islands
  FOR SELECT USING (true);

-- ONLY users existing in the admins table can update islands
CREATE POLICY "Islands are updatable by admins only" ON public.islands
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM public.admins));
CREATE POLICY "Islands are updatable by assigned agencies" ON public.islands
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.agency_island_access 
      WHERE user_id = auth.uid() AND island_id = islands.id
    )
  );

-- Policies for diaries
CREATE POLICY "Diaries are viewable by everyone" ON public.island_diaries
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own diaries" ON public.island_diaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diaries" ON public.island_diaries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diaries" ON public.island_diaries
  FOR DELETE USING (auth.uid() = user_id);

-- Insert Data
`;

for (const island of islands) {
  const escapeSql = (str) => {
    if (str === null || str === undefined) return 'NULL';
    return "'" + String(str).replace(/'/g, "''") + "'";
  };

  const area = island.area || 'NULL';
  const radius = island.radius_m || 'NULL';
  const checkin = island.checkin_radius_m || 'NULL';
  const points = island.points || 'NULL';
  const isTarget = island.is_conquest_target === false ? 'false' : 'true';
  const difficulty = escapeSql(island.difficulty);

  sql += `INSERT INTO public.islands (id, name, region_id, prefecture, coordinates, description, access, area, radius_m, checkin_radius_m, points, difficulty, is_conquest_target) VALUES (
    ${escapeSql(island.id)}, 
    ${escapeSql(island.name)}, 
    ${escapeSql(island.region_id)}, 
    ${escapeSql(island.prefecture)}, 
    ${escapeSql(island.coordinates)}, 
    ${escapeSql(island.description)}, 
    ${escapeSql(island.access)}, 
    ${area}, 
    ${radius}, 
    ${checkin}, 
    ${points}, 
    ${difficulty}, 
    ${isTarget}
  ) ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    region_id = EXCLUDED.region_id,
    prefecture = EXCLUDED.prefecture,
    coordinates = EXCLUDED.coordinates,
    description = EXCLUDED.description,
    access = EXCLUDED.access,
    area = EXCLUDED.area,
    radius_m = EXCLUDED.radius_m,
    checkin_radius_m = EXCLUDED.checkin_radius_m,
    points = EXCLUDED.points,
    difficulty = EXCLUDED.difficulty,
    is_conquest_target = EXCLUDED.is_conquest_target;
`;
}

fs.writeFileSync(path.join(__dirname, 'supabase_migration.sql'), sql);
console.log("Generated supabase_migration.sql successfully.");
