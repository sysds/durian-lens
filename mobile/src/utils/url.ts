const API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

export function resolveApiAssetUrl(url?: string | null) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;

  const apiOrigin = API_BASE.replace(/\/api\/v\d+\/?$/i, '');
  if (!apiOrigin || !url.startsWith('/')) return url;

  return `${apiOrigin}${url}`;
}
