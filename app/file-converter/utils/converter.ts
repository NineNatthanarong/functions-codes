import * as pdfjsLib from 'pdfjs-dist';
import heic2any from 'heic2any';

// Initialize PDF.js worker
if (typeof window !== 'undefined' && 'Worker' in window) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export type ConversionFormat = 'image/png' | 'image/jpeg' | 'image/webp';

export interface ConvertedFile {
    name: string;
    blob: Blob;
    type: ConversionFormat;
}

export const convertPdfToImages = async (
    file: File,
    format: ConversionFormat = 'image/png'
): Promise<ConvertedFile[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCount = pdf.numPages;
    const results: ConvertedFile[] = [];

    for (let i = 1; i <= pageCount; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // High quality
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.render(renderContext as any).promise;

        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, format, 0.95);
        });

        if (blob) {
            results.push({
                name: `${file.name.replace(/\.pdf$/i, '')}_page_${i}.${format.split('/')[1]}`,
                blob,
                type: format,
            });
        }
    }

    return results;
};

export const convertHeicToImage = async (
    file: File,
    format: ConversionFormat = 'image/jpeg'
): Promise<ConvertedFile[]> => {
    try {
        const result = await heic2any({
            blob: file,
            toType: format,
            quality: 0.9,
        });

        const blobs = Array.isArray(result) ? result : [result];

        return blobs.map((blob, index) => ({
            name: `${file.name.replace(/\.heic$/i, '')}${blobs.length > 1 ? `_${index + 1}` : ''}.${format.split('/')[1]}`,
            blob: blob as Blob,
            type: format,
        }));
    } catch (error) {
        console.error('Error converting HEIC:', error);
        throw new Error('Failed to convert HEIC file.');
    }
};

export const convertImageToImage = async (
    file: File,
    format: ConversionFormat
): Promise<ConvertedFile> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve({
                        name: `${file.name.substring(0, file.name.lastIndexOf('.'))}.${format.split('/')[1]}`,
                        blob,
                        type: format,
                    });
                } else {
                    reject(new Error('Failed to create blob'));
                }
            }, format, 0.9);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
};
