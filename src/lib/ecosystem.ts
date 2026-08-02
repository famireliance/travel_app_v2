// 輝旅エコシステム（外部関連サービス）のURLを一元管理する設定ファイル
// 開発中のサービスやドメイン変更がある場合は、このファイルまたは .env.local の環境変数を変更するだけで全ページに反映されます。

export const ECOSYSTEM_CONFIG = {
  // 📖 輝旅ガイド（公式観光・スポット情報）
  guideBaseUrl: process.env.NEXT_PUBLIC_KIRA_TABI_GUIDE_URL || 'https://guide.kira-tabi.com',
  
  // 🤖 AI Travel Companion（現在開発中 - ドメインやパスが変わる場合はここで変更するか環境変数を設定）
  aiCompanionBaseUrl: process.env.NEXT_PUBLIC_AI_COMPANION_URL || 'https://ai-travel-companion-chi.vercel.app/ja/explore',
  
  // ステータスフラグ（開発中の場合にUI上に「開発中/Beta」バッジを表示可能にする）
  isAiCompanionInDevelopment: true,
};

// KIRATABIガイド側に記事が存在しない小離島を親島へフォールバックさせるための辞書
export const GUIDE_FALLBACK_MAP: Record<string, string> = {
  // 例: 小離島 -> 親島
  '池間島': '宮古島',
  '来間島': '宮古島',
  '伊良部島': '宮古島',
  '下地島': '宮古島',
  '多良間島': '宮古島',
  '竹富島': '石垣島',
  '黒島': '石垣島',
  '小浜島': '石垣島',
  '鳩間島': '石垣島',
  '新城島': '石垣島',
  '波照間島': '石垣島',
  '与那国島': '石垣島',
  '由布島': '石垣島',
  '嘉弥真島': '石垣島',
  '西表島': '石垣島',
  '三宅島': '八丈島',
  '御蔵島': '八丈島',
  '青ヶ島': '八丈島',
  '利島': '大島',
  '新島': '大島',
  '式根島': '大島',
  '神津島': '大島',
};

/**
 * 島の名前から「輝旅ガイド」の検索・またはカテゴリURLを生成します
 */
export function getGuideUrl(islandName: string): string {
  if (!islandName) return ECOSYSTEM_CONFIG.guideBaseUrl;
  
  // フォールバック辞書に存在すれば親島を使用
  const targetIsland = GUIDE_FALLBACK_MAP[islandName] || islandName;
  
  // ガイド側が ?q= で動かない場合は ?s= (WordPress標準検索)を使用するか、
  // もしくはタグ/カテゴリのURLにする（例: /tag/miyako）
  // 今回は WordPress標準の ?s= 検索パラメータを利用する
  return `${ECOSYSTEM_CONFIG.guideBaseUrl}/?s=${encodeURIComponent(targetIsland)}`;
}

/**
 * 島の名前から「AI Travel Companion」の相談URLを生成します
 * ※ 将来的にクエリパラメータ（?destination= など）の仕様が変わった場合もここ1箇所で修正できます。
 */
export function getAiCompanionUrl(islandName: string): string {
  if (!islandName) return ECOSYSTEM_CONFIG.aiCompanionBaseUrl;
  const baseUrl = ECOSYSTEM_CONFIG.aiCompanionBaseUrl;
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}destination=${encodeURIComponent(islandName)}`;
}
