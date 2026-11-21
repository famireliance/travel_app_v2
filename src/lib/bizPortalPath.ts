export function isBizPortalHost(): boolean {
  if (typeof window !== 'undefined') {
    const h = window.location.hostname.toLowerCase().trim();
    const envB2BHost = (process.env.NEXT_PUBLIC_B2B_HOST || '')
      .toLowerCase()
      .split(':')[0]
      .trim();
    if (
      h.startsWith('partner.') ||
      h.startsWith('biz.') ||
      (Boolean(envB2BHost) && h === envB2BHost)
    ) {
      return true;
    }
  }
  return false;
}

export function getBizBasePath(): string {
  if (isBizPortalHost()) {
    return '';
  }
  return '/biz-portal-secure-8f92a1b3';
}

export function getPublicStayUrl(accId: string): string {
  const safeId = encodeURIComponent(accId);
  if (isBizPortalHost()) {
    return `https://island.kira-tabi.com/stay/${safeId}`;
  }
  return `/stay/${safeId}`;
}
