'use client';

import React, { useState } from 'react';
import { 
  Wifi, Signal, MapPin, Copy, Check, Info, ShieldAlert, 
  ExternalLink, ChevronDown, ChevronUp, Radio, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface IslandWifiSpot {
  name: string;
  location: string;
  ssid: string;
  hasPassword: boolean;
  password?: string;
  authMethod: string; // 例: 'ブラウザ認証 / SNS認証', 'パスワード入力のみ', '認証不要'
  note?: string;
}

interface IslandWifiGuideProps {
  islandId: string;
  islandName: string;
  regionId?: string;
  prefecture?: string;
}

// 地域・島ごとの公共フリーWi-Fiデータ辞書
const REGION_PUBLIC_WIFI_PRESETS: Record<string, { brandName: string; spots: IslandWifiSpot[]; cellNote: string }> = {
  // 伊豆諸島・小笠原（東京都）
  tokyo_islands: {
    brandName: 'TOKYO FREE Wi-Fi / しまぽWi-Fi',
    cellNote: '集落内・港周辺は4G/5G快調。山間部・外海航路はdocomoが最も安定。',
    spots: [
      {
        name: 'フェリーターミナル（客船待合所）',
        location: '港・船客待合所ロビー',
        ssid: 'FREE_Wi-Fi_and_TOKYO',
        hasPassword: false,
        authMethod: 'ブラウザ利用規約同意（無料）',
        note: '乗船前の待ち時間や電波が届きにくい桟橋付近でも高速通信が可能。'
      },
      {
        name: '村役場・町役場・出張所',
        location: '庁舎窓口ロビー',
        ssid: 'TOKYO_FREE_Wi-Fi',
        hasPassword: false,
        authMethod: 'メールアドレスまたはSNS認証',
        note: '平日の開庁時間および庁舎前ベンチ付近で利用可能。'
      },
      {
        name: '観光協会・ビジターセンター',
        location: '案内所内・休憩スペース',
        ssid: 'Shimapo_Free_WiFi',
        hasPassword: false,
        authMethod: 'ワンタップ接続',
        note: 'しまぽ通貨の購入・チャージや観光情報の閲覧に最適。'
      }
    ]
  },
  // 奄美・屋久島・トカラ・トカラ列島（鹿児島県）
  amami: {
    brandName: 'しまぽWi-Fi / 奄美群島フリーWi-Fi',
    cellNote: '港・空港・集落は全社4G。マングローブ林や山間部・トンネルはdocomo・au推奨。',
    spots: [
      {
        name: '各港・フェリー待合所',
        location: '船客待合所ロビー・観光案内所',
        ssid: 'Amami_Free_WiFi',
        hasPassword: false,
        authMethod: 'ブラウザ同意画面（1回60分・回数無制限）',
        note: 'フェリー入出港時や荒天時の最新運航状況確認に活用できます。'
      },
      {
        name: '役場・支所・公民館',
        location: '本庁舎・コミュニティスペース',
        ssid: 'Kagoshima_Free_WiFi',
        hasPassword: false,
        authMethod: '利用規約同意のみ',
        note: '防災拠点としても機能。'
      }
    ]
  },
  // 沖縄本島周辺・宮古・八重山
  okinawa: {
    brandName: 'Be.Okinawa Free Wi-Fi / やえやまFree Wi-Fi',
    cellNote: '平坦な島（波照間・竹富など）は全域電波良好。西表島の内陸・ジャングルは圏外多数。',
    spots: [
      {
        name: '離島ターミナル・港待合所',
        location: '各島フェリー乗り場ロビー',
        ssid: 'Be_Okinawa_Free_Wi-Fi',
        hasPassword: false,
        authMethod: '多言語対応Web認証（無料・無制限）',
        note: '船の出航待ちや電子乗船券の表示に便利。'
      },
      {
        name: '観光案内所・役場・ゆらてぃく広場',
        location: '集落中心部・公共施設',
        ssid: 'Yaeyama_Free_Wi-Fi',
        hasPassword: false,
        authMethod: 'ワンタップ接続',
        note: '集落散策時の通信に活用できます。'
      }
    ]
  }
};

export default function IslandWifiGuide({ islandId, islandName, regionId, prefecture }: IslandWifiGuideProps) {
  const [copiedSsid, setCopiedSsid] = useState<string | null>(null);
  const [copiedPw, setCopiedPw] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [dynamicSpots, setDynamicSpots] = useState<IslandWifiSpot[] | null>(null);
  const [dynamicCellNote, setDynamicCellNote] = useState<string | null>(null);

  // 地域プリセットの判定
  let preset = REGION_PUBLIC_WIFI_PRESETS.tokyo_islands;
  if (prefecture === '沖縄県' || regionId?.includes('yaeyama') || regionId?.includes('okinawa') || regionId?.includes('miyako')) {
    preset = REGION_PUBLIC_WIFI_PRESETS.okinawa;
  } else if (prefecture === '鹿児島県' || regionId?.includes('amami') || regionId?.includes('yakushima')) {
    preset = REGION_PUBLIC_WIFI_PRESETS.amami;
  }

  // 運営管理マスターAPIからの動的最新データ取得（オフライン時は自動フォールバック）
  useEffect(() => {
    let isMounted = true;
    async function fetchLatestWifi() {
      try {
        const res = await fetch(`/api/islands/${encodeURIComponent(islandId)}/wifi-spots`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.spots && data.spots.length > 0) {
              setDynamicSpots(data.spots);
            }
            if (data.cellNote) {
              setDynamicCellNote(data.cellNote);
            }
          }
        }
      } catch {
        // オフライン・通信障害時は静的プリセットを継続利用
      }
    }
    fetchLatestWifi();
    return () => { isMounted = false; };
  }, [islandId]);

  const effectiveSpots = (dynamicSpots && dynamicSpots.length > 0) ? dynamicSpots : preset.spots;
  const effectiveCellNote = dynamicCellNote || preset.cellNote;

  const handleCopy = async (text: string, type: 'ssid' | 'pw') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'ssid') {
        setCopiedSsid(text);
        setTimeout(() => setCopiedSsid(null), 2500);
      } else {
        setCopiedPw(text);
        setTimeout(() => setCopiedPw(null), 2500);
      }
      toast.success(`「${text}」をコピーしました！`, { icon: '📋' });
    } catch {
      toast.error('コピーに失敗しました');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 text-white shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Wifi className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
              OFFLINE / PUBLIC WI-FI GUIDE
            </span>
          </div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <span>{islandName}のフリーWi-Fi ＆ 電波情報</span>
          </h3>
          <p className="text-xs text-slate-400">
            船や港に到着後、電波が不安定な時でも役立つ島内の公共通信スポット一覧です（オフライン表示対応）。
          </p>
        </div>

        {/* 携帯電波バッジ */}
        <div className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3 shrink-0">
          <Signal className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="text-[11px] leading-tight">
            <span className="text-slate-400 block font-medium">キャリア電波目安:</span>
            <span className="text-slate-200 font-bold">{effectiveCellNote}</span>
          </div>
        </div>
      </div>

      {/* 公共フリーWi-Fi スポット一覧 */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <span>🏛️ {islandName}で使える主な公共フリーWi-Fi</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
            {preset.brandName}
          </span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {effectiveSpots.map((spot, idx) => (
            <div
              key={idx}
              className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{spot.name}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {spot.location}
                </p>

                {/* SSID 表示 ＆ ワンタップコピー */}
                <div className="mt-2 p-2 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">SSID</span>
                    <span className="font-mono text-xs text-emerald-400 font-bold truncate block select-all">
                      {spot.ssid}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(spot.ssid, 'ssid')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition shrink-0"
                    title="SSIDをコピー"
                  >
                    {copiedSsid === spot.ssid ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-900 space-y-1 text-[11px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>認証方式:</span>
                  <span className="text-slate-300 font-medium">{spot.authMethod}</span>
                </div>
                {spot.note && (
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {spot.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🚨 災害時統一Wi-Fi「00000JAPAN」について */}
      <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl flex items-start gap-3">
        <Radio className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-300 leading-relaxed">
          <p className="font-bold text-white flex items-center gap-1.5">
            <span>台風・緊急時の通信確保：「00000JAPAN」（ファイブゼロジャパン）</span>
          </p>
          <p className="text-slate-400 text-[11px]">
            台風や地震などによる離島の大規模停電・通信障害発生時には、契約キャリアに関わらず誰でも無料で利用できる災害用統一SSID『<strong className="text-emerald-300 select-all font-mono">00000JAPAN</strong>』が各避難所・役場・港待合所で開放されます。パスワードなしで即座に接続可能です。
          </p>
        </div>
      </div>
    </div>
  );
}
