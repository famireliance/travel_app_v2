import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function BizPortalRootPage() {
  const h = await headers();
  const rawHost = (h.get('x-forwarded-host') || h.get('host') || '')
    .toLowerCase()
    .split(':')[0]
    .trim();
  const envB2BHost = (process.env.NEXT_PUBLIC_B2B_HOST || '')
    .toLowerCase()
    .split(':')[0]
    .trim();

  const isB2BHost =
    rawHost.startsWith('partner.') ||
    rawHost.startsWith('biz.') ||
    (Boolean(envB2BHost) && rawHost === envB2BHost);

  redirect(isB2BHost ? '/dashboard' : '/biz-portal-secure-8f92a1b3/dashboard');
}
