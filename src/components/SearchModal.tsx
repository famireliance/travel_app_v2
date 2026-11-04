import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchAllIslands } from '@/lib/supabase';
import { getIslandDifficulty } from '@/lib/difficulty';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import regionsData from '@/data/regions.json';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIsland?: (islandId: string) => void;
}

const SETOUCHI_REGION_IDS = new Set([
  'ieshima',
  'pseudo_awaji',
  'kasaoka',
  'suo_oshima',
  'kutsuna',
  'kamijima',
  'naoshima',
  'shiwaku',
]);

const REGION_SEARCH_MAP: Record<string, string> = {};
regionsData.forEach((r) => {
  const extra = SETOUCHI_REGION_IDS.has(r.id) ? '瀬戸内 瀬戸内海 Setouchi せとうち' : '';
  REGION_SEARCH_MAP[r.id] = `${r.name} ${r.enName} ${r.area} ${r.id} ${extra}`;
});

export function toHiragana(str: string): string {
  if (!str) return '';
  return str.replace(/[\u30a1-\u30f6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

const ROMAJI_TABLE: [string, string][] = [
  ['kya', 'きゃ'], ['kyu', 'きゅ'], ['kyo', 'きょ'],
  ['sha', 'しゃ'], ['shu', 'しゅ'], ['sho', 'しょ'],
  ['sya', 'しゃ'], ['syu', 'しゅ'], ['syo', 'しょ'],
  ['cha', 'ちゃ'], ['chu', 'ちゅ'], ['cho', 'ちょ'],
  ['tya', 'ちゃ'], ['tyu', 'ちゅ'], ['tyo', 'ちょ'],
  ['nya', 'にゃ'], ['nyu', 'にゅ'], ['nyo', 'にょ'],
  ['hya', 'ひゃ'], ['hyu', 'ひゅ'], ['hyo', 'ひょ'],
  ['mya', 'みゃ'], ['myu', 'みゅ'], ['myo', 'みょ'],
  ['rya', 'りゃ'], ['ryu', 'りゅ'], ['ryo', 'りょ'],
  ['gya', 'ぎゃ'], ['gyu', 'ぎゅ'], ['gyo', 'ぎょ'],
  ['ja', 'じゃ'], ['ju', 'じゅ'], ['jo', 'じょ'],
  ['jya', 'じゃ'], ['jyu', 'じゅ'], ['jyo', 'じょ'],
  ['zya', 'じゃ'], ['zyu', 'じゅ'], ['zyo', 'じょ'],
  ['bya', 'びゃ'], ['byu', 'びゅ'], ['byo', 'びょ'],
  ['pya', 'ぴゃ'], ['pyu', 'ぴゅ'], ['pyo', 'ぴょ'],
  ['shi', 'し'], ['chi', 'ち'], ['tsu', 'つ'],
  ['fu', 'ふ'], ['ji', 'じ'],
  ['ka', 'か'], ['ki', 'き'], ['ku', 'く'], ['ke', 'け'], ['ko', 'こ'],
  ['sa', 'さ'], ['si', 'し'], ['su', 'す'], ['se', 'せ'], ['so', 'そ'],
  ['ta', 'た'], ['ti', 'ち'], ['tu', 'つ'], ['te', 'て'], ['to', 'と'],
  ['na', 'な'], ['ni', 'に'], ['nu', 'ぬ'], ['ne', 'ね'], ['no', 'の'],
  ['ha', 'は'], ['hi', 'ひ'], ['hu', 'ふ'], ['he', 'へ'], ['ho', 'ほ'],
  ['ma', 'ま'], ['mi', 'み'], ['mu', 'む'], ['me', 'め'], ['mo', 'も'],
  ['ya', 'や'], ['yu', 'ゆ'], ['yo', 'よ'],
  ['ra', 'ら'], ['ri', 'り'], ['ru', 'る'], ['re', 'れ'], ['ro', 'ろ'],
  ['wa', 'わ'], ['wo', 'を'],
  ['ga', 'が'], ['gi', 'ぎ'], ['gu', 'ぐ'], ['ge', 'げ'], ['go', 'ご'],
  ['za', 'ざ'], ['zi', 'じ'], ['zu', 'ず'], ['ze', 'ぜ'], ['zo', 'ぞ'],
  ['da', 'だ'], ['di', 'ぢ'], ['du', 'づ'], ['de', 'で'], ['do', 'ど'],
  ['ba', 'ば'], ['bi', 'び'], ['bu', 'ぶ'], ['be', 'べ'], ['bo', 'ぼ'],
  ['pa', 'ぱ'], ['pi', 'ぴ'], ['pu', 'ぷ'], ['pe', 'ぺ'], ['po', 'ぽ'],
  ['a', 'あ'], ['i', 'い'], ['u', 'う'], ['e', 'え'], ['o', 'お'],
];

export function romajiToHiragana(str: string): string {
  if (!str) return '';
  let s = str.toLowerCase().replace(/[^a-z]/g, '');
  s = s.replace(/([bcdfghjklmpqrstvwxyz])\1/g, 'っ$1');
  let out = '';
  let i = 0;
  while (i < s.length) {
    if (s[i] === 'っ') {
      out += 'っ';
      i++;
      continue;
    }
    if (s[i] === 'n' && s[i + 1] === 'n' && (i + 2 === s.length || !'aiueoy'.includes(s[i + 2]))) {
      out += 'ん';
      i += 2;
      continue;
    }
    if (s[i] === 'n' && (i + 1 === s.length || !'aiueoy'.includes(s[i + 1]))) {
      out += 'ん';
      i++;
      continue;
    }
    if (s[i] === 'm' && i + 1 < s.length && 'bmp'.includes(s[i + 1])) {
      out += 'ん';
      i++;
      continue;
    }
    let matched = false;
    for (const [rom, hira] of ROMAJI_TABLE) {
      if (s.startsWith(rom, i)) {
        out += hira;
        i += rom.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out += s[i];
      i++;
    }
  }
  return out;
}

export function simplifyKana(str: string): string {
  return toHiragana(str)
    .replace(/づ/g, 'ず')
    .replace(/ぢ/g, 'じ')
    .replace(/([おこそとのほもよろをごぞどぼぽょうくすつぬふむゆるぐずぶぷゅ])[うお]/g, '$1')
    .replace(/ー/g, '');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function matchesIslandSearch(i: any, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  const master = ALL_ISLANDS_MASTER_DICTIONARY[String(i.id)] || {};
  const name = String(i.name || master.name || '');
  const prefecture = String(i.prefecture || master.prefecture || '');
  const slug = String(i.slug || master.slug || '').toLowerCase();
  const yomi = String(i.yomi || master.yomi || '');
  const description = String(i.description || master.description || '');
  const access = String(i.access || master.access || '');
  const category = String(i.category || master.category || '');
  const tagsArr = Array.isArray(i.tags) ? i.tags : Array.isArray(master.tags) ? master.tags : [];
  const tags = tagsArr.join(' ');
  const regionId = String(i.region_id || master.region_id || '');
  const regionText = REGION_SEARCH_MAP[regionId] || regionId;

  // 1. Direct substring match (kanji, romaji slug, description, access, tags, region)
  const combinedRaw = `${name} ${prefecture} ${slug} ${yomi} ${description} ${access} ${category} ${tags} ${regionText}`.toLowerCase();
  if (combinedRaw.includes(q)) return true;

  // 2. Hiragana normalized match (handles katakana queries like イシガキ and hiragana queries like いしがき against romaji slug)
  const qHira = toHiragana(q);
  const slugHira = romajiToHiragana(slug);
  const regionHira = romajiToHiragana(regionId);
  const combinedHira = toHiragana(`${name} ${prefecture} ${yomi} ${description} ${access} ${tags} ${regionText}`) + ` ${slugHira} ${regionHira}`;
  if (combinedHira.includes(qHira)) return true;

  // 3. Phonetic long-vowel simplified kana match (e.g. ごとう -> ごと, しょうどしま -> しょどしま, こうづ -> こず)
  const qSimp = simplifyKana(qHira);
  if (qSimp.length >= 2) {
    const combinedSimp = `${simplifyKana(slugHira)} ${simplifyKana(yomi)} ${simplifyKana(regionHira)} ${simplifyKana(regionText)}`;
    if (combinedSimp.includes(qSimp)) return true;
  }

  return false;
}

export default function SearchModal({ isOpen, onClose, onSelectIsland }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [allIslands, setAllIslands] = useState<any[]>(() => Object.values(ALL_ISLANDS_MASTER_DICTIONARY));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedDifficulty(null);
      setResults([]);
    } else if (allIslands.length === 0) {
      setLoading(true);
      fetchAllIslands()
        .then(data => {
          if (data && data.length > 0) setAllIslands(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen, allIslands.length]);

  useEffect(() => {
    if (!query.trim() && selectedDifficulty === null) {
      setResults([]);
      return;
    }
    const q = query.trim();
    const seenKeys = new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filtered: any[] = [];

    // Sort so conquest targets and exact/prefix matches come first before deduplication
    const candidates = [...allIslands].sort((a, b) => {
      const aTarget = a.is_conquest_target !== false ? 1 : 0;
      const bTarget = b.is_conquest_target !== false ? 1 : 0;
      if (aTarget !== bTarget) return bTarget - aTarget;
      if (q) {
        const aNameMatch = String(a.name || '').includes(q) ? 1 : 0;
        const bNameMatch = String(b.name || '').includes(q) ? 1 : 0;
        if (aNameMatch !== bNameMatch) return bNameMatch - aNameMatch;
      }
      return 0;
    });

    for (const i of candidates) {
      const matchQuery = !q || matchesIslandSearch(i, q);
      if (!matchQuery) continue;
      const diff = getIslandDifficulty(i);
      const matchDiff = selectedDifficulty === null || diff.level === selectedDifficulty;
      if (!matchDiff) continue;

      const dedupKey = `${i.name || ''}__${i.prefecture || ''}`;
      if (seenKeys.has(dedupKey)) continue;
      seenKeys.add(dedupKey);
      filtered.push(i);
      if (filtered.length >= 30) break;
    }

    setResults(filtered);
  }, [query, selectedDifficulty, allIslands]);

  const difficulties = [
    { level: 1, label: '🌱 ★1 風の回廊島', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200' },
    { level: 2, label: '⛵ ★2 沿岸の旅島', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200' },
    { level: 3, label: '🧭 ★3 本格冒険島', color: 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200' },
    { level: 4, label: '🌋 ★4 秘境フロンティア', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200' },
    { level: 5, label: '👑 ★5 伝説の孤島', color: 'bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200' },
    { level: 0, label: '🔒 渡航制限島（対象外）', color: 'bg-slate-800 text-amber-300 hover:bg-slate-900 border-slate-700' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-[#F8FAFC]/95 backdrop-blur-xl flex flex-col pt-20 px-6 font-sans h-[100dvh] w-screen"
        >
          <button 
            onClick={onClose}
            className="absolute top-8 right-6 lg:right-12 p-2 text-slate-400 hover:text-slate-800 transition-colors"
          >
            <X size={32} strokeWidth={1} />
          </button>

          <div className="w-full max-w-3xl mx-auto flex flex-col items-center h-full">
            <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-slate-400 mb-6 shrink-0">Search Islands</h2>
            
            <div className="relative w-full mb-6 shrink-0">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 text-slate-300" strokeWidth={1} />
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="島名で探す..." 
                className="w-full bg-transparent border-b-2 border-slate-200 text-3xl lg:text-5xl font-serif text-slate-800 placeholder-slate-300 py-4 pl-12 focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
            </div>

            <div className="w-full mb-8 shrink-0">
              <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">アクセス難易度フィルター</p>
              <div className="flex flex-wrap gap-2">
                {difficulties.map(d => (
                  <button
                    key={d.level}
                    onClick={() => setSelectedDifficulty(selectedDifficulty === d.level ? null : d.level)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                      selectedDifficulty === d.level 
                        ? d.color.replace('100', '500').replace('text-', 'text-white border-transparent')
                        : `bg-white border-slate-200 text-slate-600 hover:${d.color.split(' ')[0]}`
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full overflow-y-auto pr-4 pb-24">
              {loading && <div className="text-center text-slate-400 tracking-widest text-sm">検索中...</div>}
              
              {!loading && results.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {results.map(island => {
                    const diff = getIslandDifficulty(island);
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={island.id}
                        onClick={() => {
                          onClose();
                          if (onSelectIsland) {
                            onSelectIsland(island.id);
                          } else {
                            router.push(`/island/${island.id}`);
                          }
                        }}
                        className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-serif font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors">{island.name}</h3>
                            <span className="text-[0.6rem] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Star size={10} className="text-amber-500" fill="currentColor" /> {diff.level}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 tracking-widest flex items-center gap-1">
                            <MapPin size={12} /> {island.prefecture}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {!loading && (query.length > 0 || selectedDifficulty !== null) && results.length === 0 && (
                <div className="text-center text-slate-400 font-serif mt-10">
                  条件に一致する島は見つかりませんでした。
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

