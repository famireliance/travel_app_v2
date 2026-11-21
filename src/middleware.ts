import { NextRequest, NextResponse } from 'next/server';

/**
 * 3ホスト完全分離（ゼロトラスト・エッジ遮断）Middleware
 *
 * 1. 一般公開ホスト (island.kira-tabi.com / *.vercel.app / その他全ての非管理ホスト)
 *    - 一般訪問者・ボットからの /kira-system-panel-9f2*, /biz-portal-secure-8f92a1b3*, /api/admin/*
 *      へのアクセスをエッジ層で無条件に 404 Not Found として完全遮断する。
 *    - 運営マスターアンロックキー (?vault_key=...) または専用HttpOnly Cookie (__kira_vault_access)
 *      を保持する管理者ブラウザのみ Admin と B2B の双方を通過許可する。
 *    - 提携宿B2B招待キー (?partner_key=...) または専用HttpOnly Cookie (__kira_b2b_access) は
 *      /biz-portal-secure-8f92a1b3* のみ通過許可し、Admin画面および /api/admin/* は絶対に通さない。
 *
 * 2. 運営管理専用ステルスホスト (ops-vault-9f2a.kira-tabi.com)
 *    - ルート (/) で運営管理ダッシュボード (/kira-system-panel-9f2) を直接配信。
 *    - このホストからのみ /api/admin/* の実行を無条件許可。
 *
 * 3. 宿泊施設B2Bポータル専用ホスト (partner.kira-tabi.com / biz.kira-tabi.com)
 *    - ルート (/) およびクリーンパス (/login, /dashboard, /facility, /reservations, /ledger) で
 *      宿泊施設オーナー専用ポータル (/biz-portal-secure-8f92a1b3/*) を配信。
 *    - 運営管理ダッシュボードおよび /api/admin/* は完全 404 遮断（Same-Origin 完全分離）。
 */

const ADMIN_HOSTS = new Set(
  [
    'ops-vault-9f2a.kira-tabi.com',
    process.env.NEXT_PUBLIC_ADMIN_HOST,
  ]
    .filter(Boolean)
    .map((h) => String(h).toLowerCase().trim())
);

const B2B_HOSTS = new Set(
  [
    'partner.kira-tabi.com',
    'biz.kira-tabi.com',
    process.env.NEXT_PUBLIC_B2B_HOST,
  ]
    .filter(Boolean)
    .map((h) => String(h).toLowerCase().trim())
);

const B2B_CLEAN_SUBPATHS = ['/login', '/dashboard', '/facility', '/reservations', '/ledger'];

const VAULT_COOKIE_NAME = '__kira_vault_access';
const VAULT_SECRET_KEY = process.env.ADMIN_VAULT_KEY || 'kira9f2a';

const B2B_COOKIE_NAME = '__kira_b2b_access';
const B2B_SECRET_KEY = process.env.B2B_VAULT_KEY || 'kirab2b8f';

const VAULT_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30, // 30日間有効
};

function applyStrictSecurityHeaders(res: NextResponse, isAdmin: boolean): NextResponse {
  res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', isAdmin ? 'no-referrer' : 'same-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (isAdmin) {
    res.headers.set('Cache-Control', 'no-store, max-age=0');
  }
  return res;
}

function createNotFoundResponse(req: NextRequest, isApi: boolean): NextResponse {
  if (isApi) {
    const res = NextResponse.json({ error: 'Not Found' }, { status: 404 });
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }
  const url = req.nextUrl.clone();
  url.pathname = '/_not-found';
  const res = NextResponse.rewrite(url, { status: 404 });
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Next.js 内部アセット・静的ファイルはそのまま通過
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/images') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname.startsWith('/workbox-')
  ) {
    return NextResponse.next();
  }

  const forwardedHost = (req.headers.get('x-forwarded-host') || '')
    .split(',')[0]
    .toLowerCase()
    .split(':')[0]
    .trim();
  const directHost = (req.headers.get('host') || '')
    .toLowerCase()
    .split(':')[0]
    .trim();
  const rawHost = forwardedHost || directHost;

  const isAdminHost = ADMIN_HOSTS.has(rawHost) || rawHost.startsWith('ops-vault-');
  const isB2BHost = B2B_HOSTS.has(rawHost) || rawHost.startsWith('partner.') || rawHost.startsWith('biz.');
  const isLocalDevHost =
    (rawHost === 'localhost' || rawHost === '127.0.0.1') &&
    (!forwardedHost || forwardedHost === directHost);

  const isManualPath = pathname === '/manual.html' || pathname === '/operation-manual.html';
  const isAdminPath =
    pathname === '/kira-system-panel-9f2' ||
    pathname.startsWith('/kira-system-panel-9f2/') ||
    isManualPath;
  const isAdminApi = pathname === '/api/admin' || pathname.startsWith('/api/admin/');
  const isB2BPath = pathname === '/biz-portal-secure-8f92a1b3' || pathname.startsWith('/biz-portal-secure-8f92a1b3/');

  // ============================================================================
  // 1. 運営管理専用ステルスホスト (ops-vault-9f2a.kira-tabi.com)
  // ============================================================================
  if (isAdminHost) {
    if (isB2BPath) {
      return createNotFoundResponse(req, false);
    }

    if (pathname === '/') {
      const url = req.nextUrl.clone();
      url.pathname = '/kira-system-panel-9f2';
      return applyStrictSecurityHeaders(NextResponse.rewrite(url), true);
    }

    if (isAdminPath || pathname.startsWith('/api/')) {
      return applyStrictSecurityHeaders(NextResponse.next(), true);
    }

    return createNotFoundResponse(req, false);
  }

  // ============================================================================
  // 2. 宿泊施設B2Bポータル専用ホスト (partner.kira-tabi.com / biz.kira-tabi.com)
  // ============================================================================
  if (isB2BHost) {
    if (isAdminPath || isAdminApi) {
      return createNotFoundResponse(req, isAdminApi);
    }

    if (pathname === '/') {
      const url = req.nextUrl.clone();
      url.pathname = '/biz-portal-secure-8f92a1b3/dashboard';
      return applyStrictSecurityHeaders(NextResponse.rewrite(url), false);
    }

    const matchedClean = B2B_CLEAN_SUBPATHS.find(
      (sub) => pathname === sub || pathname.startsWith(`${sub}/`)
    );
    if (matchedClean) {
      const url = req.nextUrl.clone();
      url.pathname = `/biz-portal-secure-8f92a1b3${pathname}`;
      return applyStrictSecurityHeaders(NextResponse.rewrite(url), false);
    }

    if (isB2BPath || pathname.startsWith('/api/')) {
      return applyStrictSecurityHeaders(NextResponse.next(), false);
    }

    return createNotFoundResponse(req, false);
  }

  // ============================================================================
  // 3. ローカル開発環境のみパススルー (localhost / 127.0.0.1 — 外部転送ヘッダなし)
  // ============================================================================
  if (isLocalDevHost) {
    if (isAdminPath || isB2BPath || isAdminApi) {
      return applyStrictSecurityHeaders(NextResponse.next(), isAdminPath || isAdminApi);
    }
    return NextResponse.next();
  }

  // ============================================================================
  // 4. 一般公開ホスト (island.kira-tabi.com / *.vercel.app / その他すべての非管理ホスト)
  // ============================================================================
  if (isAdminPath || isAdminApi || isB2BPath) {
    const queryVaultKey = searchParams.get('vault_key');
    const queryPartnerKey = searchParams.get('partner_key');
    const cookieVaultKey = req.cookies.get(VAULT_COOKIE_NAME)?.value;
    const cookieB2BKey = req.cookies.get(B2B_COOKIE_NAME)?.value;

    // 運営マスターアンロックキー (?vault_key=...) -> Admin と B2B の双方を解錠
    if (queryVaultKey === VAULT_SECRET_KEY) {
      if (isAdminApi) {
        const res = NextResponse.next();
        res.cookies.set(VAULT_COOKIE_NAME, VAULT_SECRET_KEY, VAULT_COOKIE_OPTIONS);
        return applyStrictSecurityHeaders(res, true);
      }
      const cleanUrl = req.nextUrl.clone();
      cleanUrl.searchParams.delete('vault_key');
      const res = NextResponse.redirect(cleanUrl);
      res.cookies.set(VAULT_COOKIE_NAME, VAULT_SECRET_KEY, VAULT_COOKIE_OPTIONS);
      return applyStrictSecurityHeaders(res, isAdminPath);
    }

    // 提携宿パートナー招待キー (?partner_key=...) -> B2B パスのみを解錠（Admin は絶対に通さない）
    if (isB2BPath && queryPartnerKey === B2B_SECRET_KEY) {
      const cleanUrl = req.nextUrl.clone();
      cleanUrl.searchParams.delete('partner_key');
      const res = NextResponse.redirect(cleanUrl);
      res.cookies.set(B2B_COOKIE_NAME, B2B_SECRET_KEY, VAULT_COOKIE_OPTIONS);
      return applyStrictSecurityHeaders(res, false);
    }

    // マスターVault Cookie は Admin / Admin API / B2B 全て通過
    if (cookieVaultKey === VAULT_SECRET_KEY) {
      return applyStrictSecurityHeaders(NextResponse.next(), isAdminPath || isAdminApi);
    }

    // B2B パートナー Cookie は isB2BPath のみ通過（isAdminPath / isAdminApi は完全遮断）
    if (isB2BPath && cookieB2BKey === B2B_SECRET_KEY) {
      return applyStrictSecurityHeaders(NextResponse.next(), false);
    }

    // 一般訪問者・ボット・未解錠の *.vercel.app アクセスには完全 404 Not Found を返す
    return createNotFoundResponse(req, isAdminApi);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)$).*)',
  ],
};
