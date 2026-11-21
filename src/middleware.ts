import { NextRequest, NextResponse } from 'next/server';

/**
 * 3オリジン完全分離 ＋ CTログ(crt.sh)スキャナー無力化 ゼロトラスト Middleware
 *
 * 1. 運営管理専用ステルスホスト (ops-vault-9f2a.kira-tabi.com)
 *    - SSL証明書発行時に公開される Certificate Transparency (crt.sh) ログ経由の自動スキャン対策として、
 *      専用ホスト上であってもマスターVault Cookie (__kira_vault_access) 未保持のアクセスは全て 404 遮断。
 *    - 初回のみ ?vault_key=<ADMIN_VAULT_KEY> で解錠すると HostOnly・HttpOnly・Secure Cookie（30日間）を発行し、
 *      URLからキーを自動除去してクリーンな https://ops-vault-9f2a.kira-tabi.com/ で運用可能。
 *    - 許可パスは /, /kira-system-panel-9f2*, /manual.html, /operation-manual.html, /api/admin/* のみ。
 *
 * 2. 宿泊施設B2Bポータル専用ホスト (partner.kira-tabi.com / biz.kira-tabi.com)
 *    - 運営管理画面および /api/admin/* は無条件 404 遮断（Same-Origin 完全分離）。
 *    - デフォルトで招待キー (?partner_key=<B2B_VAULT_KEY>) によるステルス404ゲートを適用し、
 *      CTログ監視ボットにログイン画面すら露出しない（B2B_OPEN_HOST=true 指定時のみキー不要化可能）。
 *    - 許可パスは /, /login, /dashboard, /facility, /reservations, /ledger, /biz-portal-secure-8f92a1b3*, /api/b2b/* のみ。
 *
 * 3. 一般公開ホスト (island.kira-tabi.com / *.vercel.app / その他すべての非管理ホスト)
 *    - *.vercel.app プレビュー/デプロイURLからの管理・B2Bアクセスはデフォルト完全 404 遮断。
 *    - STRICT_DOMAIN_ISOLATION=true 設定時は、island.kira-tabi.com 上でもキー有無に関わらず
 *      Admin / B2B パス・APIを無条件 404 完全封鎖（専用サブドメインへの100%物理分離モード）。
 *    - DNS未設定期間のフォールバック時は、?vault_key (Admin+B2B) と ?partner_key (B2B専用) を完全分離検証。
 */

const ADMIN_HOSTS = new Set(
  [
    'ops-vault-9f2a.kira-tabi.com',
    process.env.ADMIN_HOST,
    process.env.NEXT_PUBLIC_ADMIN_HOST,
  ]
    .filter(Boolean)
    .map((h) => String(h).toLowerCase().trim())
);

const B2B_HOSTS = new Set(
  [
    'partner.kira-tabi.com',
    'biz.kira-tabi.com',
    process.env.B2B_HOST,
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

// Domain属性を付与しないことで HostOnly Cookie とし、サブドメイン間のCookie共有をブラウザレベルで禁止
const VAULT_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30, // 30日間有効
};

/**
 * タイミング攻撃（文字長・先頭一致による推測）を防ぐ定数時間比較
 */
function safeEqual(a: string | null | undefined, b: string): boolean {
  if (!a || !b) return false;
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

function applyStrictSecurityHeaders(res: NextResponse, isAdmin: boolean): NextResponse {
  res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', isAdmin ? 'no-referrer' : 'same-origin');
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  );
  res.headers.set(
    'Content-Security-Policy',
    "frame-ancestors 'none'; base-uri 'self'; object-src 'none'"
  );
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  if (isAdmin) {
    res.headers.set('Cache-Control', 'no-store, max-age=0');
  }
  return res;
}

function createNotFoundResponse(req: NextRequest, isApi: boolean): NextResponse {
  if (isApi) {
    const res = NextResponse.json({ error: 'Not Found' }, { status: 404 });
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;
  }
  const url = req.nextUrl.clone();
  url.pathname = '/_not-found';
  const res = NextResponse.rewrite(url, { status: 404 });
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('Cache-Control', 'no-store, max-age=0');
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

  // 厳格な完全一致リストのみで専用ホストを判定（前方一致ワイルドカードを排除）
  const isAdminHost = ADMIN_HOSTS.has(rawHost);
  const isB2BHost = B2B_HOSTS.has(rawHost);
  const isVercelPreviewHost = rawHost.endsWith('.vercel.app');
  const isLocalDevHost =
    (rawHost === 'localhost' || rawHost === '127.0.0.1') &&
    (!forwardedHost || forwardedHost === directHost);

  const isManualPath = pathname === '/manual.html' || pathname === '/operation-manual.html';
  const isAdminPath =
    pathname === '/kira-system-panel-9f2' ||
    pathname.startsWith('/kira-system-panel-9f2/') ||
    isManualPath;
  const isAdminApi = pathname === '/api/admin' || pathname.startsWith('/api/admin/');
  const isB2BPath =
    pathname === '/biz-portal-secure-8f92a1b3' ||
    pathname.startsWith('/biz-portal-secure-8f92a1b3/');

  // 公開宿泊詳細ページ (/stay/[id]) からの公開施設情報参照のみ一般許可し、それ以外の /api/b2b/* はエッジ保護
  const isPublicStayFacilityLookup =
    req.method === 'GET' &&
    pathname === '/api/b2b/facility' &&
    searchParams.get('public') === '1';
  const isB2BApi =
    (pathname === '/api/b2b' || pathname.startsWith('/api/b2b/')) &&
    !isPublicStayFacilityLookup;

  const queryVaultKey = searchParams.get('vault_key');
  const queryPartnerKey = searchParams.get('partner_key');
  const cookieVaultKey = req.cookies.get(VAULT_COOKIE_NAME)?.value;
  const cookieB2BKey = req.cookies.get(B2B_COOKIE_NAME)?.value;

  // ============================================================================
  // 1. 運営管理専用ステルスホスト (ops-vault-9f2a.kira-tabi.com)
  // ============================================================================
  if (isAdminHost) {
    if (isB2BPath || isB2BApi) {
      return createNotFoundResponse(req, isB2BApi);
    }

    // 初回アンロック: ?vault_key=<ADMIN_VAULT_KEY> 検証後に HostOnly Cookie を発行しクリーンURLへリダイレクト
    if (safeEqual(queryVaultKey, VAULT_SECRET_KEY)) {
      if (isAdminApi) {
        const res = NextResponse.next();
        res.cookies.set(VAULT_COOKIE_NAME, VAULT_SECRET_KEY, VAULT_COOKIE_OPTIONS);
        return applyStrictSecurityHeaders(res, true);
      }
      const cleanUrl = req.nextUrl.clone();
      cleanUrl.searchParams.delete('vault_key');
      const res = NextResponse.redirect(cleanUrl);
      res.cookies.set(VAULT_COOKIE_NAME, VAULT_SECRET_KEY, VAULT_COOKIE_OPTIONS);
      return applyStrictSecurityHeaders(res, true);
    }

    // CTログ(crt.sh)スキャナー対策: 専用サブドメイン上でもマスターCookie未保持なら無条件 404
    if (!safeEqual(cookieVaultKey, VAULT_SECRET_KEY)) {
      return createNotFoundResponse(req, pathname.startsWith('/api/'));
    }

    if (pathname === '/') {
      const url = req.nextUrl.clone();
      url.pathname = '/kira-system-panel-9f2';
      return applyStrictSecurityHeaders(NextResponse.rewrite(url), true);
    }

    if (isAdminPath || isAdminApi) {
      return applyStrictSecurityHeaders(NextResponse.next(), true);
    }

    return createNotFoundResponse(req, pathname.startsWith('/api/'));
  }

  // ============================================================================
  // 2. 宿泊施設B2Bポータル専用ホスト (partner.kira-tabi.com / biz.kira-tabi.com)
  // ============================================================================
  if (isB2BHost) {
    if (isAdminPath || isAdminApi) {
      return createNotFoundResponse(req, isAdminApi);
    }

    // パートナー招待キー (?partner_key=...) または運営キーでの解錠（B2Bオリジンには B2B Cookie のみ保存）
    if (safeEqual(queryPartnerKey, B2B_SECRET_KEY) || safeEqual(queryVaultKey, VAULT_SECRET_KEY)) {
      if (isB2BApi) {
        const res = NextResponse.next();
        res.cookies.set(B2B_COOKIE_NAME, B2B_SECRET_KEY, VAULT_COOKIE_OPTIONS);
        return applyStrictSecurityHeaders(res, false);
      }
      const cleanUrl = req.nextUrl.clone();
      cleanUrl.searchParams.delete('partner_key');
      cleanUrl.searchParams.delete('vault_key');
      const res = NextResponse.redirect(cleanUrl);
      res.cookies.set(B2B_COOKIE_NAME, B2B_SECRET_KEY, VAULT_COOKIE_OPTIONS);
      return applyStrictSecurityHeaders(res, false);
    }

    // CTログスキャナー対策: B2B_OPEN_HOST=true が明示されない限り B2B Cookie 未保持は 404 遮断
    const isB2BHostUnlocked =
      process.env.B2B_OPEN_HOST === 'true' ||
      safeEqual(cookieB2BKey, B2B_SECRET_KEY) ||
      safeEqual(cookieVaultKey, VAULT_SECRET_KEY);

    if (!isB2BHostUnlocked) {
      return createNotFoundResponse(req, pathname.startsWith('/api/'));
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

    if (isB2BPath || isB2BApi || isPublicStayFacilityLookup) {
      return applyStrictSecurityHeaders(NextResponse.next(), false);
    }

    return createNotFoundResponse(req, pathname.startsWith('/api/'));
  }

  // ============================================================================
  // 3. ローカル開発環境のみパススルー (localhost / 127.0.0.1 — 外部転送ヘッダなし)
  // ============================================================================
  if (isLocalDevHost) {
    if (isAdminPath || isB2BPath || isAdminApi || isB2BApi) {
      return applyStrictSecurityHeaders(NextResponse.next(), isAdminPath || isAdminApi);
    }
    return NextResponse.next();
  }

  // ============================================================================
  // 4. 一般公開ホスト (island.kira-tabi.com / *.vercel.app / その他すべての非管理ホスト)
  // ============================================================================
  if (isAdminPath || isAdminApi || isB2BPath || isB2BApi) {
    const isApiRequest = isAdminApi || isB2BApi;

    // Vercel 自動生成URL (*.vercel.app) からの管理・B2B進入を完全封鎖
    if (isVercelPreviewHost && process.env.ALLOW_VERCEL_PREVIEW_VAULT !== 'true') {
      return createNotFoundResponse(req, isApiRequest);
    }

    // 専用サブドメインDNS開通後の完全物理分離モード（公開ドメイン側からは鍵付きでも完全404遮断）
    if (process.env.STRICT_DOMAIN_ISOLATION === 'true') {
      return createNotFoundResponse(req, isApiRequest);
    }

    // 運営マスターアンロックキー (?vault_key=...) -> Admin と B2B の双方を解錠
    if (safeEqual(queryVaultKey, VAULT_SECRET_KEY)) {
      if (isApiRequest) {
        const res = NextResponse.next();
        res.cookies.set(VAULT_COOKIE_NAME, VAULT_SECRET_KEY, VAULT_COOKIE_OPTIONS);
        return applyStrictSecurityHeaders(res, isAdminApi);
      }
      const cleanUrl = req.nextUrl.clone();
      cleanUrl.searchParams.delete('vault_key');
      const res = NextResponse.redirect(cleanUrl);
      res.cookies.set(VAULT_COOKIE_NAME, VAULT_SECRET_KEY, VAULT_COOKIE_OPTIONS);
      return applyStrictSecurityHeaders(res, isAdminPath);
    }

    // 提携宿パートナー招待キー (?partner_key=...) -> B2B パス・APIのみを解錠（Admin は絶対に通さない）
    if ((isB2BPath || isB2BApi) && safeEqual(queryPartnerKey, B2B_SECRET_KEY)) {
      if (isB2BApi) {
        const res = NextResponse.next();
        res.cookies.set(B2B_COOKIE_NAME, B2B_SECRET_KEY, VAULT_COOKIE_OPTIONS);
        return applyStrictSecurityHeaders(res, false);
      }
      const cleanUrl = req.nextUrl.clone();
      cleanUrl.searchParams.delete('partner_key');
      const res = NextResponse.redirect(cleanUrl);
      res.cookies.set(B2B_COOKIE_NAME, B2B_SECRET_KEY, VAULT_COOKIE_OPTIONS);
      return applyStrictSecurityHeaders(res, false);
    }

    // マスターVault Cookie は Admin / Admin API / B2B 全て通過
    if (safeEqual(cookieVaultKey, VAULT_SECRET_KEY)) {
      return applyStrictSecurityHeaders(NextResponse.next(), isAdminPath || isAdminApi);
    }

    // B2B パートナー Cookie は B2B パス・APIのみ通過（isAdminPath / isAdminApi は完全遮断）
    if ((isB2BPath || isB2BApi) && safeEqual(cookieB2BKey, B2B_SECRET_KEY)) {
      return applyStrictSecurityHeaders(NextResponse.next(), false);
    }

    // 一般訪問者・ボットには完全 404 Not Found を返す
    return createNotFoundResponse(req, isApiRequest);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)$).*)',
  ],
};
