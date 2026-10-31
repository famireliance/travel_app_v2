import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  org_id?: string;
  org_name?: string;
}

export async function getAuthUser(req: NextRequest): Promise<AdminUser | null> {
  const token = req.headers.get('x-admin-password');
  if (!token) return null;

  const masterPw = process.env.ADMIN_PASSWORD || '';
  if (token === masterPw) {
    return {
      id: 'master-admin-id',
      email: 'admin@kira-tabi.com',
      name: 'Master Admin',
      role: 'super_admin',
      org_name: 'システム管理'
    };
  }

  // Check if token is a valid UUID format (session ID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(token) && SERVICE_ROLE_KEY && !SERVICE_ROLE_KEY.startsWith('REPLACE')) {
    try {
      const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      
      const { data, error } = await client
        .from('admin_sessions')
        .select(`
          user_id,
          expires_at,
          admin_users (
            id, email, name, role, org_id,
            admin_organizations ( name )
          )
        `)
        .eq('id', token)
        .single();
        
      if (!error && data && new Date(data.expires_at) > new Date()) {
        const u = data.admin_users as any;
        const orgName = u?.admin_organizations?.name || (u.org_id ? '自治体組織' : 'システム管理');
        return {
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          org_id: u.org_id,
          org_name: orgName
        };
      }
    } catch (err) {
      console.error('[adminAuth] DB session check failed:', err);
    }
  }

  return null;
}

export async function verifyAdmin(req: NextRequest): Promise<AdminUser | null> {
  return await getAuthUser(req);
}

export async function getAdminPassword(): Promise<string> {
  return process.env.ADMIN_PASSWORD || '';
}
