-- Migration Script for Fairies Table
-- Created for Travel App CMS Integration

DROP TABLE IF EXISTS public.fairies CASCADE;

CREATE TABLE public.fairies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fairy_key TEXT UNIQUE NOT NULL,
    base_fairy_key TEXT,
    name TEXT NOT NULL,
    theme TEXT NOT NULL,
    description TEXT NOT NULL,
    region_id TEXT,
    island_id TEXT,
    rarity TEXT NOT NULL CHECK (rarity IN ('NORMAL', 'RARE', 'EPIC', 'SPOT_EXCLUSIVE')),
    attribute TEXT NOT NULL CHECK (attribute IN ('WATER', 'NATURE', 'FIRE', 'LIGHT', 'EARTH', 'WIND', 'ICE')),
    collab_sponsor TEXT,
    icon TEXT NOT NULL,
    image_url TEXT,
    custom_photo_url TEXT,
    color_from TEXT NOT NULL,
    color_to TEXT NOT NULL,
    shadow_color TEXT NOT NULL,
    sparkle_color TEXT NOT NULL,
    is_time_limited BOOLEAN DEFAULT false,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    checkin_radius_m FLOAT,
    is_qr_exclusive BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.fairies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fairies are viewable by everyone" ON public.fairies
    FOR SELECT USING (true);

CREATE POLICY "Fairies are insertable by admins only" ON public.fairies
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM public.admins));

CREATE POLICY "Fairies are updatable by admins only" ON public.fairies
    FOR UPDATE USING (auth.uid() IN (SELECT id FROM public.admins));

CREATE POLICY "Fairies are deletable by admins only" ON public.fairies
    FOR DELETE USING (auth.uid() IN (SELECT id FROM public.admins));

-- Trigger to auto update updated_at
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW; 
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fairies_modtime 
BEFORE UPDATE ON public.fairies 
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Seed Initial Data from FAIRIES_MASTER
INSERT INTO public.fairies (fairy_key, name, theme, region_id, rarity, attribute, icon, image_url, color_from, color_to, shadow_color, sparkle_color, description) VALUES
('fairy_okinawa_main', 'ルリ (Ruri)', '琉球の波の妖精', 'okinawa_main', 'NORMAL', 'WATER', '🐬', '/fairies/ruri.jpg', 'from-cyan-400', 'to-blue-600', 'shadow-cyan-500/50', 'text-cyan-200', '沖縄本島周辺の美しい波間に住む妖精。見つけた人に清らかな心と癒やしをもたらすと言われています。'),
('fairy_yaeyama', 'ティダ (Tida)', '八重山の太陽精霊', 'yaeyama', 'RARE', 'FIRE', '🌺', '/fairies/tida.jpg', 'from-rose-400', 'to-orange-500', 'shadow-rose-500/50', 'text-rose-200', '八重山の力強い太陽の光から生まれた妖精。南国の情熱と底抜けの明るさで、旅人を笑顔にします。'),
('fairy_amami', 'シダ (Shida)', '奄美の深緑の妖精', 'amami', 'NORMAL', 'NATURE', '🌿', '/fairies/shida.jpg', 'from-emerald-400', 'to-teal-600', 'shadow-emerald-500/50', 'text-emerald-200', 'アマミノクロウサギと仲良しの森の妖精。マングローブの森の奥深くにひっそりと暮らしています。'),
('fairy_miyako', 'ブルー (Blue)', '宮古ブルーの化身', 'miyako', 'EPIC', 'WATER', '🦋', '/fairies/blue.jpg', 'from-sky-300', 'to-blue-700', 'shadow-sky-500/60', 'text-sky-100', '東洋一美しいと言われる宮古島の海の青さが結晶化して生まれた奇跡の妖精。滅多に姿を現しません。'),
('fairy_ogasawara', 'ホシ (Hoshi)', 'ボニンブルーの星妖精', 'ogasawara', 'EPIC', 'LIGHT', '🐋', '/fairies/hoshi.png', 'from-indigo-400', 'to-purple-700', 'shadow-indigo-500/50', 'text-indigo-200', '小笠原の深い海と、満天の星空を繋ぐクジラの妖精。はるか遠くの海から旅人を歓迎してくれます。'),
('fairy_izu', 'ツバキ (Tsubaki)', '伊豆の火の精霊', 'izu', 'NORMAL', 'FIRE', '🌸', '/fairies/tsubaki.png', 'from-pink-400', 'to-rose-600', 'shadow-pink-500/50', 'text-pink-200', '伊豆大島の椿の花から生まれた妖精。温泉と暖かい場所が大好きで、湯けむりに乗って移動します。');

INSERT INTO public.fairies (fairy_key, name, theme, island_id, rarity, attribute, icon, image_url, color_from, color_to, shadow_color, sparkle_color, description) VALUES
('fairy_okinawa_manza', 'ゾウ (Zou)', '万座毛の崖精霊', 'okinawa_main', 'SPOT_EXCLUSIVE', 'EARTH', '🐘', '/fairies/zou.jpg', 'from-green-600', 'to-slate-800', 'shadow-green-500/50', 'text-green-200', '沖縄本島の景勝地「万座毛」に棲む力強い精霊。雄大な自然のエネルギーを旅人に分け与えます。'),
('fairy_ishigaki_kabira', 'カビラ (Kabira)', '川平湾の透明な妖精', 'ishigaki', 'SPOT_EXCLUSIVE', 'WATER', '🐠', '/fairies/kabira.jpg', 'from-teal-300', 'to-emerald-600', 'shadow-teal-500/50', 'text-teal-200', '石垣島・川平湾の透き通る海面から生まれた妖精。太陽の光を浴びて七色に輝くと言われています。'),
('fairy_miyako_yonaha', 'マイ (Mai)', '与那覇前浜の砂妖精', 'miyako', 'SPOT_EXCLUSIVE', 'EARTH', '🐚', '/fairies/mai.jpg', 'from-amber-100', 'to-orange-300', 'shadow-amber-500/50', 'text-amber-100', '東洋一白い砂浜と呼ばれる与那覇前浜ビーチのサラサラな砂から生まれた妖精。'),
('fairy_amami_mangrove', 'グル (Guru)', '黒潮マングローブの主', 'amami', 'SPOT_EXCLUSIVE', 'NATURE', '🐊', '/fairies/guru.jpg', 'from-lime-500', 'to-green-900', 'shadow-lime-500/50', 'text-lime-200', '奄美大島のマングローブ林を静かに見守る古き森の主。大自然の神秘を肌で感じた者にのみ姿を現します。');

INSERT INTO public.fairies (fairy_key, name, theme, region_id, rarity, attribute, icon, image_url, color_from, color_to, shadow_color, sparkle_color, description) VALUES
('fairy_hokkaido', 'ユキ (Yuki)', '北海道の雪キツネ', 'hokkaido', 'NORMAL', 'ICE', '🦊', '/fairies/yuki.png', 'from-blue-100', 'to-slate-300', 'shadow-blue-200/50', 'text-blue-100', '北海道のふかふかの雪から生まれたキタキツネの妖精。冷たい風に乗って旅人を優しく見守ります。'),
('fairy_tohoku', 'リン (Rin)', '東北の森とりんご', 'tohoku', 'NORMAL', 'NATURE', '🍎', '/fairies/rin.png', 'from-red-400', 'to-rose-700', 'shadow-red-500/50', 'text-red-200', '東北の豊かな森と美味しいりんごの精霊。出会うと心が温まり、お腹が空いてくると言われています。'),
('fairy_kanto', 'ライト (Light)', '関東の都会と海風', 'kanto', 'NORMAL', 'WIND', '🏙️', '/fairies/light.png', 'from-slate-300', 'to-indigo-600', 'shadow-slate-500/50', 'text-slate-200', '都会のネオンと港町の潮風が混ざり合って生まれた近代的な妖精。'),
('fairy_hokuriku', 'カニヤ (Kaniya)', '北陸の雪とカニ', 'hokuriku', 'NORMAL', 'ICE', '🦀', '/fairies/kaniya.png', 'from-orange-400', 'to-red-600', 'shadow-orange-500/50', 'text-orange-200', '北陸の厳しい冬の海からやってきた陽気なカニの精霊。美味しい海の幸が集まる場所に現れます。'),
('fairy_tokai', 'チャチャ (Chacha)', '東海の茶葉と霊峰', 'tokai', 'NORMAL', 'NATURE', '🍵', '/fairies/chacha.png', 'from-green-400', 'to-emerald-700', 'shadow-green-500/50', 'text-green-200', '香り高いお茶の葉と、遠くに見える富士山のパワーを宿したほっこり系の妖精。'),
('fairy_kinki', 'ミヤビ (Miyabi)', '近畿の歴史とシカ', 'kinki', 'NORMAL', 'EARTH', '🦌', '/fairies/miyabi.png', 'from-amber-600', 'to-orange-900', 'shadow-amber-700/50', 'text-amber-200', '古都の長い歴史を見守ってきたシカの精霊。雅なオーラで旅人を優雅な気持ちにさせます。'),
('fairy_chugoku', 'レモ (Remo)', '中国・瀬戸内のレモン', 'chugoku', 'NORMAL', 'NATURE', '🍋', '/fairies/remo.png', 'from-yellow-300', 'to-amber-500', 'shadow-yellow-500/50', 'text-yellow-100', '瀬戸内海の穏やかな気候と太陽をたっぷり浴びて育ったレモンの妖精。とてもフレッシュ。'),
('fairy_shikoku', 'ミカ (Mika)', '四国のお遍路みかん', 'shikoku', 'NORMAL', 'NATURE', '🍊', '/fairies/mika.png', 'from-orange-300', 'to-orange-600', 'shadow-orange-500/50', 'text-orange-100', '四国の温かい気候で育ったみかんの精霊。旅人の疲れを癒やすお接待の心を持っています。'),
('fairy_kyushu', 'マグ (Magu)', '九州の火山と温泉', 'kyushu', 'NORMAL', 'FIRE', '🌋', '/fairies/magu.png', 'from-red-500', 'to-slate-900', 'shadow-red-600/50', 'text-red-300', '九州の力強い火山と温泉の熱から生まれた情熱的な精霊。エネルギーに満ち溢れています。');

INSERT INTO public.fairies (fairy_key, name, theme, island_id, rarity, attribute, icon, image_url, color_from, color_to, shadow_color, sparkle_color, description) VALUES
('fairy_niigata_sado', '朱鷺音 (Tokine)', '佐渡のトキと金山', 'sado', 'RARE', 'EARTH', '🪶', '/fairies/tokine.png', 'from-rose-200', 'to-yellow-600', 'shadow-yellow-500/50', 'text-rose-100', '佐渡島の上空を舞う美しいトキと、眠る金脈の輝きから生まれた優雅な妖精。'),
('fairy_hyogo_awaji', 'タマ (Tama)', '淡路の神話たまねぎ', 'awajishima', 'RARE', 'EARTH', '🧅', '/fairies/tama.png', 'from-amber-200', 'to-orange-400', 'shadow-amber-400/50', 'text-amber-100', '国生み神話の地、淡路島の甘いタマネギの精霊。涙ではなく笑顔を引き出します。'),
('fairy_kagawa_shodo', 'オリビ (Oribi)', '小豆島のオリーブの風', 'shodoshima', 'RARE', 'WIND', '🫒', '/fairies/oribi.png', 'from-lime-400', 'to-green-700', 'shadow-lime-500/50', 'text-lime-200', '小豆島のオリーブ畑を吹き抜ける風の妖精。平和と豊穣のシンボルです。'),
('fairy_hiroshima_miyajima', 'イツク (Itsuku)', '宮島の神鹿と鳥居', 'itsukushima', 'EPIC', 'LIGHT', '⛩️', '/fairies/itsuku.png', 'from-red-500', 'to-orange-700', 'shadow-red-600/50', 'text-red-200', '海に浮かぶ大鳥居と神の使いである鹿の力を宿した神聖な妖精。'),
('fairy_kanagawa_enoshima', 'リュウ (Ryu)', '江の島の海龍', 'enoshima', 'RARE', 'WATER', '🐉', '/fairies/ryu.png', 'from-teal-400', 'to-blue-800', 'shadow-teal-500/50', 'text-teal-200', '江の島の伝説に伝わる五頭龍の末裔。湘南の海を颯爽と泳ぎ回ります。'),
('fairy_nagasaki_tsushima', 'ヤマ (Yama)', '対馬のヤマネコ', 'tsushima', 'RARE', 'NATURE', '🐈', '/fairies/yama.png', 'from-stone-400', 'to-stone-700', 'shadow-stone-500/50', 'text-stone-200', '国境の島、対馬の深い森に隠れ住むヤマネコの妖精。とても警戒心が強いが一度懐くと離れない。'),
('fairy_kagoshima_yakushima', 'コダマ (Kodama)', '屋久杉と苔の精', 'yakushima', 'EPIC', 'NATURE', '🌲', '/fairies/kodama.png', 'from-green-600', 'to-emerald-900', 'shadow-green-700/50', 'text-green-300', '何千年も生きる屋久杉の森から生まれた古代の精霊。生命の神秘そのものです。'),
('fairy_kagawa_naoshima', 'アート (Art)', '直島の現代アート', 'naoshima', 'RARE', 'LIGHT', '🎃', '/fairies/art.png', 'from-yellow-400', 'to-red-500', 'shadow-yellow-500/50', 'text-yellow-200', '直島の現代アートから飛び出してきたような、前衛的でポップなカボチャの妖精。'),
('fairy_shimane_oki', 'ウシマ (Ushima)', '隠岐の島の潮風と牛', 'dogo', 'RARE', 'EARTH', '🐄', '/fairies/ushima.png', 'from-slate-200', 'to-slate-600', 'shadow-slate-400/50', 'text-slate-100', '隠岐の島の絶壁に立つ力強い牛の妖精。日本海の荒波にも負けない力強さを持つ。'),
('fairy_kagoshima_sakurajima', 'イグニ (Igni)', '桜島の燃える火山弾', 'sakurajima', 'RARE', 'FIRE', '🔥', '/fairies/igni.png', 'from-red-600', 'to-orange-900', 'shadow-red-600/50', 'text-red-300', '桜島の噴火と共に生まれる情熱の妖精。触ると少し熱い。'),
('fairy_okinawa_shisa', 'シサ (Shisa)', '沖縄の守り神シーサー', 'okinawa_main', 'RARE', 'FIRE', '🦁', '/fairies/shisa.jpg', 'from-orange-500', 'to-red-700', 'shadow-orange-600/50', 'text-orange-300', '沖縄の家々を守るシーサーから生まれた力強い妖精。悪い運気を追い払ってくれます。'),
('fairy_yonaguni_horse', 'ヨナ (Yona)', '与那国馬と最西端の風', 'yonaguni', 'RARE', 'WIND', '🐴', '/fairies/yonaguni_horse.jpg', 'from-amber-400', 'to-yellow-800', 'shadow-amber-500/50', 'text-amber-200', '日本最西端の与那国島で力強く生きる与那国馬の妖精。たくましい足腰を持っています。'),
('fairy_miyako_horse', 'ミヤ (Miya)', '宮古馬とサトウキビ畑', 'miyako', 'RARE', 'EARTH', '🐎', '/fairies/miyako_horse.jpg', 'from-yellow-200', 'to-amber-600', 'shadow-yellow-400/50', 'text-yellow-100', '宮古島の風土と共に育った宮古馬の妖精。のんびりとした性格で癒やされます。'),
('fairy_hateruma_cross', 'クロス (Cross)', '波照間の南十字星', 'hateruma', 'EPIC', 'LIGHT', '✨', '/fairies/hateruma_cross.jpg', 'from-indigo-300', 'to-purple-800', 'shadow-indigo-400/50', 'text-indigo-100', '日本最南端・波照間島の夜空に輝く南十字星の妖精。星降る夜にだけ姿を見せます。'),
('fairy_ogasawara_chichijima', 'ホエ（Hoe）', '小笠原のザトウクジラ', 'ogasawara', 'EPIC', 'WATER', '🐋', '/fairies/ogasawara_whale.jpg', 'from-blue-400', 'to-indigo-800', 'shadow-blue-500/50', 'text-blue-200', 'ボニンブルーの海を雄大に泳ぐザトウクジラの妖精。ダイナミックなジャンプで旅人を歓迎します。');

INSERT INTO public.fairies (fairy_key, base_fairy_key, name, theme, island_id, collab_sponsor, rarity, attribute, icon, image_url, color_from, color_to, shadow_color, sparkle_color, description) VALUES
('fairy_okinawa_main_kirahotel', 'fairy_okinawa_main', 'ルリ (キラキラホテルVer)', '特別ホテルリゾート衣装', 'okinawa_main', 'キラキラホテルリゾート', 'SPOT_EXCLUSIVE', 'LIGHT', '🏨', '/fairies/ruri_kirahotel.png', 'from-purple-400', 'to-pink-600', 'shadow-purple-500/50', 'text-purple-200', 'キラキラホテルリゾートとの特別コラボ！ホテルの制服を着た激レアバージョンのルリです。');

INSERT INTO public.fairies (fairy_key, name, theme, region_id, rarity, attribute, icon, image_url, color_from, color_to, shadow_color, sparkle_color, description) VALUES
('fairy_hokkaido_shimaenaga', 'エナ (Ena)', '雪の妖精シマエナガ', 'hokkaido', 'EPIC', 'ICE', '🐦', '/fairies/shimaenaga.jpg', 'from-slate-50', 'to-slate-200', 'shadow-slate-300/50', 'text-white', '雪の妖精とも呼ばれるシマエナガの精霊。真っ白でふわふわな真ん丸の体をしています。');
