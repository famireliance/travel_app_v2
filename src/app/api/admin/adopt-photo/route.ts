import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/adminAuth';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';
import { ALL_ISLANDS_MASTER_DICTIONARY } from '@/data/allIslandsMaster';
import { getVerifiedIslandPhotos } from '@/lib/islandPhoto';

interface DbIslandLite {
  id: string;
  slug?: string | null;
  name?: string | null;
  prefecture?: string | null;
  hero_image_url?: string | null;
  image_url?: string | null;
}

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.startsWith('REPLACE')) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function resolveMasterIsland(rawIslandId: string) {
  const trimmed = String(rawIslandId || '').trim();
  const lower = trimmed.toLowerCase();
  return (
    ALL_ISLANDS_MASTER_DICTIONARY[trimmed] ||
    Object.values(ALL_ISLANDS_MASTER_DICTIONARY).find(
      (isl) => isl.slug === lower || isl.name === trimmed
    ) ||
    null
  );
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 503 });
    }

    const [
      { data: diaryRows, error: diaryErr },
      { data: dbIslands },
      adoptedDiaryIds,
      photographersMap,
    ] = await Promise.all([
      adminClient
        .from('island_diaries')
        .select('*')
        .not('photo_url', 'is', null)
        .neq('photo_url', '')
        .order('created_at', { ascending: false })
        .limit(100),
      adminClient.from('islands').select('id, slug, name, prefecture, hero_image_url, image_url'),
      getFallbackJson<string[]>('fallback_adopted_diary_ids', []),
      getFallbackJson<Record<string, { count: number; islands: string[] }>>(
        'fallback_certified_photographers',
        {}
      ),
    ]);

    if (diaryErr) {
      return NextResponse.json({ error: diaryErr.message }, { status: 500 });
    }

    const dbIslandById = new Map<string, DbIslandLite>();
    const dbIslandBySlug = new Map<string, DbIslandLite>();
    for (const row of (dbIslands || []) as DbIslandLite[]) {
      if (row.id !== undefined && row.id !== null) {
        dbIslandById.set(String(row.id), row);
      }
      if (typeof row.slug === 'string' && row.slug) {
        dbIslandBySlug.set(row.slug.toLowerCase(), row);
      }
    }

    const adoptedSet = new Set((Array.isArray(adoptedDiaryIds) ? adoptedDiaryIds : []).map(String));
    const adoptedIslandsSet = new Set<string>();
    for (const entry of Object.values(photographersMap || {})) {
      if (Array.isArray(entry?.islands)) {
        for (const islId of entry.islands) {
          adoptedIslandsSet.add(String(islId));
        }
      }
    }

    // Count how many master islands still lack an official verified photo
    let missingPhotoIslandsCount = 0;
    for (const master of Object.values(ALL_ISLANDS_MASTER_DICTIONARY)) {
      const dbRow =
        dbIslandById.get(String(master.id)) ||
        (master.slug ? dbIslandBySlug.get(master.slug.toLowerCase()) : undefined);
      const merged = { ...master, ...(dbRow || {}) };
      const verified = getVerifiedIslandPhotos(merged);
      if (!verified.hasVerifiedPhoto && !adoptedIslandsSet.has(String(master.id))) {
        missingPhotoIslandsCount += 1;
      }
    }

    const authorIds = Array.from(
      new Set(
        (diaryRows || [])
          .map((d: Record<string, unknown>) => (d.user_id ? String(d.user_id) : ''))
          .filter(Boolean)
      )
    );

    const profileMap = new Map<string, { nickname?: string | null; high_quality_tickets?: number | null }>();
    if (authorIds.length > 0) {
      const { data: profiles } = await adminClient
        .from('user_profiles')
        .select('id, nickname, high_quality_tickets')
        .in('id', authorIds);
      for (const p of profiles || []) {
        profileMap.set(String(p.id), p);
      }
    }

    const enrichedDiaries = (diaryRows || [])
      .filter((d: Record<string, unknown>) => typeof d.photo_url === 'string' && d.photo_url.startsWith('https://'))
      .map((d: Record<string, unknown>) => {
        const rawIslandId = String(d.island_id || '').trim();
        const master = resolveMasterIsland(rawIslandId);
        const canonicalIslandId = String(master?.id || rawIslandId);
        const dbRow =
          dbIslandById.get(canonicalIslandId) ||
          dbIslandById.get(rawIslandId) ||
          (master?.slug ? dbIslandBySlug.get(master.slug.toLowerCase()) : undefined) ||
          dbIslandBySlug.get(rawIslandId.toLowerCase());

        const mergedIsland = { ...(master || { id: canonicalIslandId, name: rawIslandId }), ...(dbRow || {}) };
        const verified = getVerifiedIslandPhotos(mergedIsland);
        const needsOfficialPhoto =
          !verified.hasVerifiedPhoto && !adoptedIslandsSet.has(canonicalIslandId);

        const authorId = d.user_id ? String(d.user_id) : '';
        const authorProfile = authorId ? profileMap.get(authorId) : undefined;
        const photographerStats = authorId ? photographersMap?.[authorId] : undefined;
        const masterPref = (master as { prefecture?: string } | null)?.prefecture;

        return {
          id: String(d.id),
          island_id: canonicalIslandId,
          raw_island_id: rawIslandId,
          island_name: String(dbRow?.name || master?.name || rawIslandId),
          prefecture: String(dbRow?.prefecture || masterPref || ''),
          photo_url: String(d.photo_url),
          content: String(d.content || ''),
          created_at: String(d.created_at || ''),
          is_hidden: Boolean(d.is_hidden),
          author_user_id: authorId,
          author_nickname: authorProfile?.nickname || null,
          author_adopted_count: Number(photographerStats?.count || 0),
          needsOfficialPhoto,
          isAdopted: adoptedSet.has(String(d.id)),
          currentOfficialPhotoUrl:
            (typeof dbRow?.hero_image_url === 'string' && dbRow.hero_image_url) ||
            verified.desktopUrl ||
            null,
        };
      });

    return NextResponse.json({
      diaries: enrichedDiaries,
      missingPhotoIslandsCount,
      adoptedCount: adoptedSet.size,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '投稿写真の取得に失敗しました';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    if (user.role === 'viewer') {
      return NextResponse.json(
        { error: '閲覧専用アカウントのため変更操作はできません' },
        { status: 403 }
      );
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 503 });
    }

    let body: {
      diaryId?: string;
      islandId?: string;
      photoUrl?: string;
      authorUserId?: string;
    } = {};
    try {
      body = (await req.json()) || {};
    } catch {
      return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
    }

    const diaryId = String(body.diaryId || '').trim();
    const rawIslandId = String(body.islandId || '').trim();
    const photoUrl = String(body.photoUrl || '').trim();
    const authorUserId = String(body.authorUserId || '').trim();

    if (!diaryId || !rawIslandId || !photoUrl) {
      return NextResponse.json(
        { error: 'diaryId, islandId, photoUrl は必須です' },
        { status: 400 }
      );
    }

    if (!photoUrl.startsWith('https://')) {
      return NextResponse.json(
        { error: 'photoUrl は https:// で始まる有効な画像URLを指定してください' },
        { status: 400 }
      );
    }

    const master = resolveMasterIsland(rawIslandId);
    const canonicalIslandId = String(master?.id || rawIslandId);

    // Update public.islands (hero_image_url & image_url)
    const { data: updatedById, error: updateIdErr } = await adminClient
      .from('islands')
      .update({ hero_image_url: photoUrl, image_url: photoUrl })
      .eq('id', canonicalIslandId)
      .select('id');

    if ((updateIdErr || !updatedById || updatedById.length === 0) && master?.slug) {
      await adminClient
        .from('islands')
        .update({ hero_image_url: photoUrl, image_url: photoUrl })
        .eq('slug', master.slug);
    } else if ((updateIdErr || !updatedById || updatedById.length === 0) && rawIslandId !== canonicalIslandId) {
      await adminClient
        .from('islands')
        .update({ hero_image_url: photoUrl, image_url: photoUrl })
        .eq('id', rawIslandId);
    }

    const adoptedDiaryIds = await getFallbackJson<string[]>('fallback_adopted_diary_ids', []);
    const safeAdoptedList = Array.isArray(adoptedDiaryIds) ? adoptedDiaryIds.map(String) : [];
    const alreadyAdopted = safeAdoptedList.includes(diaryId);

    if (!alreadyAdopted) {
      safeAdoptedList.push(diaryId);
      await setFallbackJson('fallback_adopted_diary_ids', safeAdoptedList);

      if (authorUserId) {
        // Increment user_profiles.high_quality_tickets by +1
        const { data: existingProfile } = await adminClient
          .from('user_profiles')
          .select('id, high_quality_tickets')
          .eq('id', authorUserId)
          .maybeSingle();

        const nextTickets = Number(existingProfile?.high_quality_tickets || 0) + 1;
        if (existingProfile) {
          await adminClient
            .from('user_profiles')
            .update({ high_quality_tickets: nextTickets })
            .eq('id', authorUserId);
        } else {
          await adminClient
            .from('user_profiles')
            .upsert({ id: authorUserId, high_quality_tickets: nextTickets }, { onConflict: 'id' });
        }

        // Increment fallback_certified_photographers[authorUserId]
        const photographersMap = await getFallbackJson<
          Record<string, { count: number; islands: string[] }>
        >('fallback_certified_photographers', {});
        const prevStats = photographersMap[authorUserId] || { count: 0, islands: [] };
        const prevIslands = Array.isArray(prevStats.islands) ? prevStats.islands.map(String) : [];
        const updatedIslands = Array.from(new Set([...prevIslands, canonicalIslandId]));

        photographersMap[authorUserId] = {
          count: Number(prevStats.count || 0) + 1,
          islands: updatedIslands,
        };
        await setFallbackJson('fallback_certified_photographers', photographersMap);
      }
    }

    return NextResponse.json({
      success: true,
      alreadyAdopted,
      message:
        '公式島写真に採用し、投稿者へ高画質証明書チケット1枚＆公認フォトグラファー実績を付与しました！',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '公式写真の採用処理に失敗しました';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
