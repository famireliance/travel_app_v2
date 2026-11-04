import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export interface StripeRuntimeConfig {
  stripe: Stripe;
  secretKey: string;
  priceIdPremium: string;
  priceIdUltimate: string;
  webhookSecret: string;
}

let cachedConfig: { data: StripeRuntimeConfig; expiresAt: number } | null = null;

function encryptPayload(plainJson: string, serviceRoleKey: string): string {
  const key = crypto.createHash('sha256').update(serviceRoleKey).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainJson, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    v: 1,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ct: encrypted.toString('base64'),
  });
}

function decryptOrParsePayload(rawVal: unknown, serviceRoleKey: string): Record<string, any> | null {
  if (!rawVal) return null;
  try {
    const obj = typeof rawVal === 'string' ? JSON.parse(rawVal) : rawVal;
    if (obj && obj.v === 1 && obj.iv && obj.tag && obj.ct) {
      const key = crypto.createHash('sha256').update(serviceRoleKey).digest();
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        key,
        Buffer.from(obj.iv, 'base64')
      );
      decipher.setAuthTag(Buffer.from(obj.tag, 'base64'));
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(obj.ct, 'base64')),
        decipher.final(),
      ]).toString('utf8');
      return JSON.parse(decrypted);
    }
    return obj;
  } catch {
    return null;
  }
}

/**
 * Loads Stripe configuration from Supabase `admin_config` (`key = 'stripe_live_config'`, AES-256-GCM encrypted)
 * with a 60-second in-memory cache and seamless fallback/sync with environment variables.
 */
export async function getStripeConfig(): Promise<StripeRuntimeConfig> {
  const now = Date.now();
  if (cachedConfig && cachedConfig.expiresAt > now) {
    return cachedConfig.data;
  }

  let secretKey = process.env.STRIPE_SECRET_KEY || '';
  let priceIdPremium = process.env.STRIPE_PRICE_ID_PREMIUM || '';
  let priceIdUltimate = process.env.STRIPE_PRICE_ID_ULTIMATE || '';
  let webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  const envIsLive = secretKey.startsWith('sk_live_');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey && !serviceRoleKey.startsWith('REPLACE')) {
    try {
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data } = await adminClient
        .from('admin_config')
        .select('value')
        .eq('key', 'stripe_live_config')
        .maybeSingle();

      const rawObj = data?.value
        ? typeof data.value === 'string'
          ? JSON.parse(data.value)
          : data.value
        : null;
      const isAlreadyEncrypted = Boolean(rawObj && rawObj.v === 1 && rawObj.ct);
      const parsed = decryptOrParsePayload(data?.value, serviceRoleKey);

      if (envIsLive) {
        if (
          !parsed ||
          !isAlreadyEncrypted ||
          parsed.secretKey !== secretKey ||
          parsed.priceIdPremium !== priceIdPremium ||
          parsed.priceIdUltimate !== priceIdUltimate ||
          parsed.webhookSecret !== webhookSecret
        ) {
          const encryptedValue = encryptPayload(
            JSON.stringify({
              secretKey,
              priceIdPremium,
              priceIdUltimate,
              webhookSecret,
              updatedAt: new Date().toISOString(),
            }),
            serviceRoleKey
          );
          await adminClient.from('admin_config').upsert(
            {
              key: 'stripe_live_config',
              value: encryptedValue,
            },
            { onConflict: 'key' }
          );
        }
      } else if (parsed?.secretKey) {
        secretKey = parsed.secretKey;
        if (parsed.priceIdPremium) priceIdPremium = parsed.priceIdPremium;
        if (parsed.priceIdUltimate) priceIdUltimate = parsed.priceIdUltimate;
        if (parsed.webhookSecret) webhookSecret = parsed.webhookSecret;
      }
    } catch {
      // Fallback to process.env if DB is unreachable
    }
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: '2026-07-29.dahlia' as any,
  });

  const result: StripeRuntimeConfig = {
    stripe,
    secretKey,
    priceIdPremium,
    priceIdUltimate,
    webhookSecret,
  };

  cachedConfig = {
    data: result,
    expiresAt: now + 60_000,
  };

  return result;
}
