export function getBizBasePath(): string {
  if (typeof window !== 'undefined') {
    const h = window.location.hostname.toLowerCase();
    if (h.startsWith('partner.') || h.startsWith('biz.')) {
      return '';
    }
  }
  return '/biz-portal-secure-8f92a1b3';
}
