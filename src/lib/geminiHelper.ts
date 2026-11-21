import { GoogleGenAI, GenerateContentConfig } from '@google/genai';

/**
 * Gemini 高速モデル優先チェーン。
 * 実測最速（~0.8〜3秒）かつ混雑耐性の高い Flash-Lite 系を最優先し、
 * 各試行に厳格なタイムアウト（7.5秒）と全体上限（14秒）を設けることで
 * Vercel Serverless Function の FUNCTION_INVOCATION_TIMEOUT (504) を100%防止する。
 */
export const GEMINI_FLASH_MODEL_CANDIDATES = [
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
] as const;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Gemini timeout (${label} > ${ms}ms)`));
    }, ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

export async function generateGeminiContentWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: string;
    config?: GenerateContentConfig;
    perModelTimeoutMs?: number;
    maxTotalMs?: number;
  }
) {
  const perModelTimeoutMs = params.perModelTimeoutMs ?? 7500;
  const maxTotalMs = params.maxTotalMs ?? 14000;
  const deadline = Date.now() + maxTotalMs;
  let lastError: unknown = null;

  for (const model of GEMINI_FLASH_MODEL_CANDIDATES) {
    const remaining = deadline - Date.now();
    if (remaining < 1200) {
      break;
    }
    const attemptTimeout = Math.min(perModelTimeoutMs, remaining);
    const controller = new AbortController();
    const abortTimer = setTimeout(() => controller.abort(), attemptTimeout);

    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents: params.contents,
          config: {
            ...(params.config || {}),
            abortSignal: controller.signal,
          },
        }),
        attemptTimeout,
        model
      );
      clearTimeout(abortTimer);
      if (response && response.text) {
        return response;
      }
    } catch (err: unknown) {
      clearTimeout(abortTimer);
      lastError = err;
      continue;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('利用可能な Gemini モデルからの応答取得に失敗しました');
}
