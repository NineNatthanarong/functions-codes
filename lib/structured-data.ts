const SITE_URL = 'https://functions.codes';
const SITE_NAME = 'functions.codes';

export interface WebSiteSchema {
    '@context': string;
    '@type': string;
    name: string;
    url: string;
    description: string;
    potentialAction?: {
        '@type': string;
        target: {
            '@type': string;
            urlTemplate: string;
        };
        'query-input': string;
    };
}

export interface WebApplicationSchema {
    '@context': string;
    '@type': string;
    name: string;
    url: string;
    description: string;
    applicationCategory: string;
    operatingSystem: string;
    offers: {
        '@type': string;
        price: string;
        priceCurrency: string;
    };
    featureList: string[];
}

export interface SoftwareApplicationSchema {
    '@context': string;
    '@type': string;
    name: string;
    url: string;
    description: string;
    applicationCategory: string;
    operatingSystem: string;
    offers: {
        '@type': string;
        price: string;
        priceCurrency: string;
    };
    browserRequirements: string;
}

export interface BreadcrumbSchema {
    '@context': string;
    '@type': string;
    itemListElement: Array<{
        '@type': string;
        position: number;
        name: string;
        item?: string;
    }>;
}

export interface OrganizationSchema {
    '@context': string;
    '@type': string;
    name: string;
    url: string;
    logo?: string;
    description: string;
    sameAs?: string[];
}

/**
 * Generate WebSite schema with search action
 */
export function generateWebSiteSchema(): WebSiteSchema {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
        description: 'Free online tools without ads. 100% client-side, zero tracking.',
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${SITE_URL}/?search={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    };
}

/**
 * Generate WebApplication schema for the main site
 */
export function generateWebApplicationSchema(): WebApplicationSchema {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: SITE_NAME,
        url: SITE_URL,
        description: 'Free online tools for developers and creators. File conversion, image processing, code formatting, and more. No ads, no tracking, 100% client-side.',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any (Web Browser)',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        featureList: [
            'File Converter',
            'Background Remover',
            'Image Compressor',
            'QR Code Generator',
            'JSON Formatter',
            'Password Generator',
            'Color Palette Extractor',
            'Lorem Ipsum Generator',
            'Text Diff Viewer',
            'Unit Converter',
            'PDF Tools',
            'Audio Editor',
            'Markdown Editor',
        ],
    };
}

/**
 * Generate SoftwareApplication schema for individual tools
 */
export function generateToolSchema(
    toolName: string,
    toolDescription: string,
    toolPath: string
): SoftwareApplicationSchema {
    return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: `${toolName} - ${SITE_NAME}`,
        url: `${SITE_URL}/${toolPath}`,
        description: toolDescription,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any (Web Browser)',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        browserRequirements: 'Requires JavaScript. Modern browser recommended.',
    };
}

/**
 * Generate Breadcrumb schema for tool pages
 */
export function generateBreadcrumbSchema(
    toolName: string,
    toolPath: string
): BreadcrumbSchema {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: SITE_URL,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: toolName,
            },
        ],
    };
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(): OrganizationSchema {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        description: 'Free online tools without ads. Built by developers, for developers.',
    };
}

/**
 * Convert schema object to JSON-LD script tag
 */
export function schemaToScriptTag(schema: object): string {
    return JSON.stringify(schema);
}
