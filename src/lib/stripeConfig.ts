import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export interface StripeRuntimeConfig {
  stripe: Stripe;
  secretKey: string;
  priceIdPremium: string;
  priceIdUltimate: string;
  webhookSecret: string;
}

let cachedConfig: { data: StripeRuntimeConfig; expiresAt: number } | null = null;

/**
 * Loads Stripe configuration from Supabase `admin_config` (`key = 'stripe_live_config'`)
 * with a 60-second in-memory cache and seamless fallback/sync with environment variables.
 * - If local/server env has a live key (`sk_live_...`), it uses it and auto-syncs to `admin_config`.
 * - If server env still has a test key (`sk_test_...`) or is unset, it uses the live config from `admin_config`.
 */
export async function getStripeConfig(): Promise<StripeRuntimeConfig> {
  const now = Date.now();
  if (cachedConfig && cachedConfig.expiresAt > now) {
    return cachedConfig.data;
  }

  let secretKey = process.env.STRIPE_SECRET_KEY || '';
  let priceIdPremium = process.env.STRIPE_PRICE_ID_PREMIUM || 'price_premium_dummy';
  let priceIdUltimate = process.env.STRIPE_PRICE_ID_ULTIMATE || 'price_ultimate_dummy';
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

      const parsed = data?.value
        ? typeof data.value === 'string'
          ? JSON.parse(data.value)
          : data.value
        : null;

      if (envIsLive) {
        // Auto-sync live env config to Supabase admin_config if needed
        if (
          !parsed ||
          parsed.secretKey !== secretKey ||
          parsed.priceIdPremium !== priceIdPremium ||
          parsed.priceIdUltimate !== priceIdUltimate ||
          parsed.webhookSecret !== webhookSecret
        ) {
          await adminClient.from('admin_config').upsert(
            {
              key: 'stripe_live_config',
              value: JSON.stringify({
                secretKey,
                priceIdPremium,
                priceIdUltimate,
                webhookSecret,
                updatedAt: new Date().toISOString(),
              }),
            },
            { onConflict: 'key' }
          );
        }
      } else if (parsed?.secretKey) {
        // Use live config stored in Supabase admin_config
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
