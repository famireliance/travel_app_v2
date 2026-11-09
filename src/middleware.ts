import { NextRequest, NextResponse } from 'next/server';

/**
 * 3ホスト完全分離（ゼロトラスト・エッジ遮断）Middleware
 *
 * 1. 一般公開ホスト (island.kira-tabi.com)
 *    - 一般訪問者・ボットからの /kira-system-panel-9f2*, /biz-portal-secure-8f92a1b3*, /api/admin/*
 *      へのアクセスをエッジ層で無条件に 404 Not Found として完全遮断する。
 *    - ただし、DNS設定完了前の緊急管理アクセス用として、秘密の鍵パラメータ (?vault_key=kira9f2a)
 *      または専用HttpOnly Cookie (__kira_vault_access) を保持する管理者ブラウザのみ通過を許可する。
 *
 * 2. 運営管理専用ステルスホスト (ops-vault-9f2a.kira-tabi.com)
 *    - ルート (/) で運営管理ダッシュボード (/kira-system-panel-9f2) を直接配信。
 *    - このホストからのみ /api/admin/* の実行を許可。
 *
 * 3. 宿泊施設B2Bポータル専用ホスト (partner.kira-tabi.com / biz.kira-tabi.com)
 *    - ルート (/) およびクリーンパス (/login, /dashboard, /facility, /reservations, /ledger) で
 *      宿泊施設オーナー専用ポータル (/biz-portal-secure-8f92a1b3/*) を配信。
 *    - 運営管理ダッシュボードおよび /api/admin/* は完全 404 遮断（Same-Origin 完全分離）。
 */

const PUBLIC_HOSTS = new Set(
  [
    'island.kira-tabi.com',
    'www.island.kira-tabi.com',
    process.env.NEXT_PUBLIC_PUBLIC_HOST,
  ]
    .filter(Boolean)
    .map((h) => String(h).toLowerCase().trim())
);

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

  const rawHost = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '')
    .toLowerCase()
    .split(':')[0]
    .trim();

  const isAdminHost = ADMIN_HOSTS.has(rawHost) || rawHost.startsWith('ops-vault-');
  const isB2BHost = B2B_HOSTS.has(rawHost) || rawHost.startsWith('partner.') || rawHost.startsWith('biz.');
  const isPublicHost = PUBLIC_HOSTS.has(rawHost);

  const isAdminPath = pathname === '/kira-system-panel-9f2' || pathname.startsWith('/kira-system-panel-9f2/');
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
  // 3. 一般公開ホスト (island.kira-tabi.com)
  // ============================================================================
  if (isPublicHost) {
    if (isAdminPath || isAdminApi || isB2BPath) {
      // 緊急マスターアンロックキー (?vault_key=kira9f2a) の検証
      const queryVaultKey = searchParams.get('vault_key');
      const cookieVaultKey = req.cookies.get(VAULT_COOKIE_NAME)?.value;
      const hasAdminHeader = Boolean(req.headers.get('x-admin-password') || req.headers.get('authorization'));

      if (queryVaultKey === VAULT_SECRET_KEY) {
        const cleanUrl = req.nextUrl.clone();
        cleanUrl.searchParams.delete('vault_key');
        const res = NextResponse.redirect(cleanUrl);
        res.cookies.set(VAULT_COOKIE_NAME, VAULT_SECRET_KEY, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30日間有効
        });
        return applyStrictSecurityHeaders(res, true);
      }

      if (cookieVaultKey === VAULT_SECRET_KEY || (isAdminApi && hasAdminHeader)) {
        return applyStrictSecurityHeaders(NextResponse.next(), isAdminPath || isAdminApi);
      }

      // 一般訪問者・スキャナー・ボットには完全 404 Not Found を返す
      return createNotFoundResponse(req, isAdminApi);
    }
    return NextResponse.next();
  }

  // ============================================================================
  // 4. ローカル開発環境 (localhost) / Vercel プレビューURL (*.vercel.app)
  // ============================================================================
  if (isAdminPath || isB2BPath || isAdminApi) {
    return applyStrictSecurityHeaders(NextResponse.next(), isAdminPath || isAdminApi);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)$).*)',
  ],
};
