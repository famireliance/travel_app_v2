import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/adminAuth';
import { getFallbackJson, setFallbackJson } from '@/lib/adminConfigFallback';
import { logAuditEvent, extractClientInfo } from '@/lib/auditLogger';

export interface AgentReviewRecord {
  id: string;
  island_id: string;
  accommodation_id: string;
  rating: {
    islandVibe: number;
    cleanliness: number;
    food: number;
    facilities: number;
  };
  overall_score: number;
  public_review: {
    title: string;
    body: string;
    agentName: string;
    agentType: string;
  };
  owner_feedback: {
    sendToOwner: boolean;
    strengths: string;
    improvements: string;
  };
  created_at: string;
  updated_at: string;
  created_by: string;
}

const CONFIG_KEY = 'fallback_agent_reviews';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const reviews = await getFallbackJson<AgentReviewRecord[]>(CONFIG_KEY, []);
  return NextResponse.json({ reviews: Array.isArray(reviews) ? reviews : [] });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  if (user.role === 'viewer') {
    return NextResponse.json({ error: '閲覧専用アカウントのため変更操作はできません' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const rating = {
      islandVibe: Number(body.rating?.islandVibe ?? 4),
      cleanliness: Number(body.rating?.cleanliness ?? 4),
      food: Number(body.rating?.food ?? 4),
      facilities: Number(body.rating?.facilities ?? 3),
    };
    const overall_score = Number(
      ((rating.islandVibe + rating.cleanliness + rating.food + rating.facilities) / 4).toFixed(1)
    );

    const now = new Date().toISOString();
    const record: AgentReviewRecord = {
      id: body.id || `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      island_id: String(body.island_id || '').trim(),
      accommodation_id: String(body.accommodation_id || '').trim(),
      rating,
      overall_score,
      public_review: {
        title: String(body.public_review?.title || '').trim(),
        body: String(body.public_review?.body || '').trim(),
        agentName: String(body.public_review?.agentName || 'KIRATABI 調査員').trim(),
        agentType: String(body.public_review?.agentType || 'official').trim(),
      },
      owner_feedback: {
        sendToOwner: Boolean(body.owner_feedback?.sendToOwner),
        strengths: String(body.owner_feedback?.strengths || '').trim(),
        improvements: String(body.owner_feedback?.improvements || '').trim(),
      },
      created_at: body.created_at || now,
      updated_at: now,
      created_by: user.name || user.email,
    };

    const existing = await getFallbackJson<AgentReviewRecord[]>(CONFIG_KEY, []);
    const list = Array.isArray(existing) ? existing : [];
    const idx = list.findIndex((r) => r.id === record.id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.unshift(record);
    }

    await setFallbackJson(CONFIG_KEY, list);

    await logAuditEvent({
      actor: { user_id: user.id, role: user.role, name: user.name, org: user.org_name || 'System' },
      client: extractClientInfo(req),
      action: 'AGENT_REVIEW_UPSERT',
      target: {
        resource_type: 'agent_review',
        resource_id: record.id,
        island_id: record.island_id,
        details: `島プロ評価レポート「${record.public_review.title || record.accommodation_id || record.island_id}」を保存`,
      },
    });

    return NextResponse.json({ success: true, review: record, reviews: list });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '保存に失敗しました' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  if (user.role === 'viewer') {
    return NextResponse.json({ error: '閲覧専用アカウントのため変更操作はできません' }, { status: 403 });
  }

  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id が必要です' }, { status: 400 });
    }
    const existing = await getFallbackJson<AgentReviewRecord[]>(CONFIG_KEY, []);
    const list = (Array.isArray(existing) ? existing : []).filter((r) => r.id !== id);
    await setFallbackJson(CONFIG_KEY, list);
    return NextResponse.json({ success: true, reviews: list });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '削除に失敗しました' }, { status: 500 });
  }
}
