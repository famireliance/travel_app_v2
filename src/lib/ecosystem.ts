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

/**
 * 島の名前から「輝旅ガイド」の検索URLを生成します
 */
export function getGuideUrl(islandName: string): string {
  if (!islandName) return ECOSYSTEM_CONFIG.guideBaseUrl;
  return `${ECOSYSTEM_CONFIG.guideBaseUrl}/?q=${encodeURIComponent(islandName)}`;
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
