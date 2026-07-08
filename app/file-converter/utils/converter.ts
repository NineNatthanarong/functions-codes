import * as pdfjsLib from 'pdfjs-dist';
import heic2any from 'heic2any';

if (typeof window !== 'undefined' && 'Worker' in window) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
    ).toString();
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

        if (!context) {
            throw new Error(`Failed to get canvas context for page ${i}`);
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };
        await page.render(renderContext as any).promise;

        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, format, 0.95);
        });

        if (!blob) {
            throw new Error(`Failed to render page ${i} of ${pageCount}`);
        }

        results.push({
            name: `${file.name.replace(/\.pdf$/i, '')}_page_${i}.${format.split('/')[1]}`,
            blob,
            type: format,
        });
    }

    if (results.length === 0) {
        throw new Error('No pages could be converted');
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
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }
            if (format === 'image/jpeg') {
                // JPEG has no alpha channel; without this, transparent pixels turn black.
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, 0, 0);
            const dotIndex = file.name.lastIndexOf('.');
            const baseName = dotIndex === -1 ? file.name : file.name.substring(0, dotIndex);
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve({
                        name: `${baseName}.${format.split('/')[1]}`,
                        blob,
                        type: format,
                    });
                } else {
                    reject(new Error('Failed to create blob'));
                }
            }, format, 0.9);
        };
        img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err);
        };
        img.src = url;
    });
};
