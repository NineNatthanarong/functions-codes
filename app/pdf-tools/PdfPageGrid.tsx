'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { cn } from '@/lib/utils';

if (typeof window !== 'undefined' && 'Worker' in window) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
    ).toString();
}

type Thumb = {
    url: string | null;
    failed: boolean;
    aspect: number;
};

export default function PdfPageGrid({
    file,
    pageCount,
    selected,
    onToggle,
    pageWord,
    loadingLabel,
}: {
    file: File;
    pageCount: number;
    selected: number[];
    onToggle: (index: number) => void;
    pageWord: string;
    loadingLabel: string;
}) {
    const [thumbs, setThumbs] = useState<Thumb[]>(() =>
        Array.from({ length: pageCount }, () => ({ url: null, failed: false, aspect: 0.72 }))
    );

    useEffect(() => {
        let cancelled = false;
        const urls: string[] = [];

        setThumbs(Array.from({ length: pageCount }, () => ({ url: null, failed: false, aspect: 0.72 })));

        (async () => {
            try {
                const data = new Uint8Array(await file.arrayBuffer());
                const pdf = await pdfjsLib.getDocument({ data }).promise;
                const count = Math.min(pdf.numPages, pageCount);

                for (let i = 1; i <= count; i++) {
                    if (cancelled) break;
                    try {
                        const page = await pdf.getPage(i);
                        const base = page.getViewport({ scale: 1 });
                        const scale = Math.min(1.6, 200 / base.width);
                        const viewport = page.getViewport({ scale });
                        const canvas = document.createElement('canvas');
                        canvas.width = Math.max(1, Math.round(viewport.width));
                        canvas.height = Math.max(1, Math.round(viewport.height));
                        const ctx = canvas.getContext('2d', { alpha: false });
                        if (!ctx) throw new Error('no ctx');
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        await page.render({ canvasContext: ctx, viewport } as never).promise;
                        const blob: Blob | null = await new Promise((resolve) =>
                            canvas.toBlob(resolve, 'image/jpeg', 0.7)
                        );
                        if (!blob) throw new Error('no blob');
                        canvas.width = 0;
                        canvas.height = 0;
                        const url = URL.createObjectURL(blob);
                        urls.push(url);
                        if (cancelled) {
                            URL.revokeObjectURL(url);
                            break;
                        }
                        const aspect = viewport.height / viewport.width;
                        setThumbs((prev) => {
                            const next = [...prev];
                            next[i - 1] = { url, failed: false, aspect };
                            return next;
                        });
                    } catch {
                        if (!cancelled) {
                            setThumbs((prev) => {
                                const next = [...prev];
                                next[i - 1] = { url: null, failed: true, aspect: 0.72 };
                                return next;
                            });
                        }
                    }
                    await new Promise((r) => requestAnimationFrame(r));
                }
            } catch {
                if (!cancelled) {
                    setThumbs((prev) => prev.map((t) => ({ ...t, failed: true })));
                }
            }
        })();

        return () => {
            cancelled = true;
            urls.forEach((u) => URL.revokeObjectURL(u));
        };
    }, [file, pageCount]);

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[min(70vh,40rem)] overflow-y-auto pr-1">
            {thumbs.map((thumb, idx) => {
                const sel = selected.includes(idx);
                return (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => onToggle(idx)}
                        aria-pressed={sel}
                        aria-label={`${pageWord} ${idx + 1}`}
                        className={cn(
                            'relative text-left bg-white border-2 min-h-11 focus-visible:outline focus-visible:outline-offset-2',
                            sel
                                ? 'border-[var(--color-accent)]'
                                : 'border-[var(--color-line)] hover:border-[var(--color-ink)]'
                        )}
                    >
                        <span
                            className="block w-full bg-[var(--color-surface-2)] overflow-hidden"
                            style={{ aspectRatio: `1 / ${thumb.aspect || 0.72}` }}
                        >
                            {thumb.url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={thumb.url}
                                    alt=""
                                    className="w-full h-full max-w-none object-contain bg-white"
                                    draggable={false}
                                />
                            ) : (
                                <span className="flex h-full items-center justify-center px-2 text-center text-[12px] text-[var(--color-ink-3)]">
                                    {thumb.failed ? `${pageWord} ${idx + 1}` : loadingLabel}
                                </span>
                            )}
                        </span>
                        <span
                            className={cn(
                                'absolute left-1.5 top-1.5 min-w-7 h-7 px-1.5 inline-flex items-center justify-center text-[12px] font-semibold tabular-nums',
                                sel
                                    ? 'bg-[var(--color-accent)] text-[var(--color-ink-2)]'
                                    : 'bg-[var(--color-tower)] text-white'
                            )}
                        >
                            {idx + 1}
                        </span>
                        {sel && (
                            <span className="absolute right-1.5 top-1.5 w-7 h-7 inline-flex items-center justify-center bg-[var(--color-accent)] text-[var(--color-ink-2)]">
                                <Check className="w-3.5 h-3.5" strokeWidth={2.6} />
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
