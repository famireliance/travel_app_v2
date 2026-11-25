import { NextResponse } from 'next/server';

function sanitizeDownloadFilename(rawName: string | null): { ascii: string; utf8Encoded: string } {
  const cleaned = (rawName || 'KIRATABI_Certificate.png')
    .replace(/[\r\n"\\/:*?<>|]/g, '_')
    .trim();
  const withExt = /\.(png|jpe?g|webp)$/i.test(cleaned) ? cleaned : `${cleaned}.png`;
  const asciiFallback = withExt.replace(/[^\x20-\x7E]/g, '_').replace(/_+/g, '_');
  return {
    ascii: asciiFallback || 'KIRATABI_Certificate.png',
    utf8Encoded: encodeURIComponent(withExt),
  };
}

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const rawUrl = searchParams.get('url');
    const rawName = searchParams.get('name');

    if (!rawUrl) {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl.trim());
    } catch {
      return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
    }

    const expectedHost = new URL(supabaseUrl).hostname;
    const allowedPrefixA = '/storage/v1/object/public/certificates/';
    const allowedPrefixB = '/storage/v1/object/public/public-assets/certificates/';

    if (
      parsed.protocol !== 'https:' ||
      parsed.hostname !== expectedHost ||
      (!parsed.pathname.startsWith(allowedPrefixA) && !parsed.pathname.startsWith(allowedPrefixB))
    ) {
      return NextResponse.json({ error: '許可されていない画像URLです' }, { status: 403 });
    }

    const upstream = await fetch(parsed.toString(), { cache: 'no-store' });
    if (!upstream.ok) {
      return NextResponse.json({ error: '証明書画像の取得に失敗しました' }, { status: 404 });
    }

    const contentType = upstream.headers.get('content-type') || 'image/png';
    const arrayBuffer = await upstream.arrayBuffer();
    const { ascii, utf8Encoded } = sanitizeDownloadFilename(rawName);

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(arrayBuffer.byteLength),
        'Content-Disposition': `attachment; filename="${ascii}"; filename*=UTF-8''${utf8Encoded}`,
        'Cache-Control': 'private, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error('Certificate download proxy error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
