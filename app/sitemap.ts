import type { MetadataRoute } from 'next';

// Canonical site origin (same derivation as layout.tsx metadataBase) so the
// sitemap always matches the deployment's real domain.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://brothersfitness.in';

// L42: update this date when page content changes — `new Date()` always
// returns "today" at fetch time, giving crawlers no signal about stale pages.
const LAST_CONTENT_UPDATE = '2025-08-01';

// Public marketing routes only — admin pages are excluded (restricted area).
const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/pricing', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/workouts', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/calculators', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/quotes', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/fuel', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/trophy-room', priority: 0.5, changeFrequency: 'monthly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(LAST_CONTENT_UPDATE),
    changeFrequency,
    priority,
  }));
}
