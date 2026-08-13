import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://brothersfitness.in';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Admin panel is restricted to authorized personnel — keep crawlers out.
      disallow: ['/admin/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
