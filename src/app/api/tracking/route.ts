import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';

const ALLOWED_EVENTS = new Set(['phone_call_click', 'website_click', 'lp_view']);
const FALLBACK_TRACKING_KEY = 'fallback_tracking_events';
const MAX_FALLBACK_EVENTS = 500;

const RATE_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_MAX_EVENTS = 30;
const trackingRateMap = new Map<string, number[]>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

function isTrackingRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (trackingRateMap.get(ip) || []).filter((ts) => now - ts < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX_EVENTS) {
    trackingRateMap.set(ip, recent);
    return true;
  }
  recent.push(now);
  trackingRateMap.set(ip, recent);
  if (trackingRateMap.size > 2000) {
    for (const [k, v] of trackingRateMap.entries()) {
      const filtered = v.filter((ts) => now - ts < RATE_WINDOW_MS);
      if (filtered.length === 0) trackingRateMap.delete(k);
      else trackingRateMap.set(k, filtered);
    }
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (isTrackingRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const facilityId = String(body?.facilityId ?? body?.facility_id ?? '').trim().slice(0, 120);
    const eventType = String(body?.eventType ?? body?.event_type ?? '').trim();
    const sessionId =
      typeof body?.sessionId === 'string' && body.sessionId.trim()
        ? body.sessionId.trim().slice(0, 120)
        : null;

    if (!facilityId || !ALLOWED_EVENTS.has(eventType)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const userAgent = (req.headers.get('user-agent') || 'unknown').slice(0, 300);
    const createdAt = new Date().toISOString();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.startsWith('REPLACE')) {
      return NextResponse.json({ ok: true });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await adminClient.from('tracking_events').insert([
      {
        facility_id: facilityId,
        event_type: eventType,
        user_agent: userAgent,
        session_id: sessionId,
        created_at: createdAt,
      },
    ]);

    if (error) {
      const existing = await getFallbackJson<any[]>(FALLBACK_TRACKING_KEY, []);
      const list = Array.isArray(existing) ? existing : [];
      const nextList = [
        {
          id: crypto.randomUUID(),
          facility_id: facilityId,
          event_type: eventType,
          user_agent: userAgent,
          session_id: sessionId,
          created_at: createdAt,
        },
        ...list,
      ].slice(0, MAX_FALLBACK_EVENTS);
      await setFallbackJson(FALLBACK_TRACKING_KEY, nextList);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
