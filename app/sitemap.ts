import { MetadataRoute } from 'next';

const SITE_URL = 'https://functions.codes';

export default function sitemap(): MetadataRoute.Sitemap {
    const tools = [
        'file-converter',
        'bgrm',
        'image-compressor',
        'qr-generator',
        'json-formatter',
        'password-generator',
        'color-palette',
        'lorem-ipsum',
        'diff-viewer',
        'unit-converter',
        'pdf-tools',
        'audio-editor',
        'markdown-editor',
    ];

    // Home page
    const routes: MetadataRoute.Sitemap = [
        {
            url: SITE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
    ];

    // Tool pages
    tools.forEach((tool) => {
        routes.push({
            url: `${SITE_URL}/${tool}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        });
    });

    return routes;
}
