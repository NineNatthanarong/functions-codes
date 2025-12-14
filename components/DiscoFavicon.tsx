'use client';

import { useEffect } from 'react';

export default function DiscoFavicon() {
    useEffect(() => {
        // Disco colors array - vibrant pub/disco vibe
        const colors = [
            '#ff0080', // Hot pink
            '#00ff80', // Neon green
            '#0080ff', // Electric blue
            '#ff8000', // Orange
            '#8000ff', // Purple
            '#ff0000', // Red
            '#00ffff', // Cyan
        ];

        let currentIndex = 0;

        // SVG cursor path
        const cursorPath = 'M9.313 14.906v1.313h1.313v1.313h-3.969v2.656h1.313v2.656h1.344v2.656h-2.656v-2.656h-1.344v-2.656h-1.313v-1.313h-1.344v1.313h-1.313v1.344h-1.344v-14.594h1.344v1.313h1.313v1.344h1.344v1.313h1.313v1.344h1.344v1.313h1.313v1.344h1.344z';

        const updateFavicon = () => {
            const color = colors[currentIndex];

            // Create SVG with current color
            const svg = `<svg fill="${color}" width="32" height="32" viewBox="-10.5 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <path d="${cursorPath}"/>
      </svg>`;

            // Convert to data URL
            const dataUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`;

            // Update favicon
            let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = dataUrl;

            // Move to next color
            currentIndex = (currentIndex + 1) % colors.length;
        };

        // Update every 300ms for smooth disco effect
        const interval = setInterval(updateFavicon, 300);

        // Initial update
        updateFavicon();

        // Cleanup
        return () => clearInterval(interval);
    }, []);

    return null;
}
