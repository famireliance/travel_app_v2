import { GoogleGenAI, GenerateContentConfig } from '@google/genai';

/**
 * Gemini モデル名の優先フォールバックチェーン。
 * Google 側のモデル世代更新（例: gemini-2.5-flash の廃止・gemini-3.8-flash への移行）が起きても
 * 自動で有効な最新 Flash モデルへフォールバックし、500 エラーを防止する。
 */
export const GEMINI_FLASH_MODEL_CANDIDATES = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
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
      const msg = err instanceof Error ? err.message : String(err);
      // モデル非対応・404・廃止エラーの場合は次の候補モデルへフォールバック
      if (
        msg.includes('404') ||
        msg.includes('NOT_FOUND') ||
        msg.includes('no longer available') ||
        msg.includes('not found') ||
        msg.includes('not supported')
      ) {
        continue;
      }
      throw err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('利用可能な Gemini モデルからの応答取得に失敗しました');
}
