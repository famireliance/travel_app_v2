import { GoogleGenAI, GenerateContentConfig } from '@google/genai';

/**
 * Gemini モデル名の優先フォールバックチェーン。
 * Google 側のモデル世代更新（404 NOT_FOUND）や特定モデルへの負荷集中（503 UNAVAILABLE / 429）が起きても
 * 自動で別の稼働中 Flash モデルへフォールバックし、エラーを防止する。
 */
export const GEMINI_FLASH_MODEL_CANDIDATES = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
] as const;

export async function generateGeminiContentWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: string;
    config?: GenerateContentConfig;
  }
) {
  let lastError: unknown = null;

  for (const model of GEMINI_FLASH_MODEL_CANDIDATES) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        ...(params.config ? { config: params.config } : {}),
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: unknown) {
      lastError = err;
      // 404 (廃止), 503 (高負荷), 429 (レート制限), 500 等の場合は次の候補モデルへ自動フォールバック
      continue;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('利用可能な Gemini モデルからの応答取得に失敗しました');
}
