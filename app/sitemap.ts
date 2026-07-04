import { MetadataRoute } from 'next';
import { TOOL_KEYS } from '@/lib/tools';

const SITE_URL = 'https://functions.codes';

export default function sitemap(): MetadataRoute.Sitemap {
    // Home page
    const routes: MetadataRoute.Sitemap = [
        {
            url: SITE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
    ];

    // Tool pages — derived from the central registry, so new tools are never missed
    TOOL_KEYS.forEach((tool) => {
        routes.push({
            url: `${SITE_URL}/${tool}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        });
    });

    return routes;
}
