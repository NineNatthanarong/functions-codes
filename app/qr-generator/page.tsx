'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
import { AlertTriangle, Copy, Download, QrCode, Settings2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, FieldLabel, TextArea, PrimaryButton, SecondaryButton, SegmentedControl } from '@/components/ToolShell';

function contrastRatio(hexA: string, hexB: string) {
    const luminance = (hex: string) => {
        const n = parseInt(hex.slice(1), 16);
        const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
            const x = c / 255;
            return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const [la, lb] = [luminance(hexA), luminance(hexB)];
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export default function QRGenerator() {
    const { t, locale } = useLanguage();
    const tt = t.pages.qr;
    const s = locale === 'th'
        ? {
            sizeLabel: 'ขนาดภาพ',
            ecLabel: 'ความทนทาน',
            ecHint: 'L 7% → H 30%',
            copyImage: 'คัดลอกรูป',
            copyFailed: 'คัดลอกรูปไม่สำเร็จ',
            contrastWarning: 'สีใกล้เคียงกันเกินไป QR อาจสแกนไม่ได้',
            tooLong: 'เนื้อหายาวเกินไปสำหรับ QR Code',
            httpsHint: 'จะเติม https:// ให้อัตโนมัติ',
            tryExample: 'ลองตัวอย่าง',
        }
        : {
            sizeLabel: 'Image size',
            ecLabel: 'Error correction',
            ecHint: 'L 7% → H 30%',
            copyImage: 'Copy image',
            copyFailed: 'Could not copy image',
            contrastWarning: 'Colors are too similar — the QR may not scan',
            tooLong: 'Content is too long for a QR code',
            httpsHint: 'https:// will be added',
            tryExample: 'Try an example',
        };
    const [text, setText] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [genError, setGenError] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<'url' | 'text'>('url');
    const [options, setOptions] = useState({
        width: 1024,
        margin: 2,
        color: { dark: '#14213d', light: '#ffffff' },
        errorCorrectionLevel: 'M' as 'L' | 'M' | 'Q' | 'H',
    });

    const trimmed = text.trim();
    const needsScheme =
        activeTab === 'url' &&
        trimmed !== '' &&
        !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) &&
        /^\S+\.\S{2,}/.test(trimmed);
    const content = needsScheme ? `https://${trimmed}` : trimmed;
    const lowContrast = contrastRatio(options.color.dark, options.color.light) < 2.5;

    // Live preview: regenerate (debounced) whenever content or options change,
    // so the preview and download can never go stale.
    useEffect(() => {
        if (!content) {
            setQrCodeUrl('');
            setGenError(false);
            return;
        }
        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                const url = await QRCode.toDataURL(content, {
                    width: options.width,
                    margin: options.margin,
                    color: options.color,
                    errorCorrectionLevel: options.errorCorrectionLevel,
                });
                if (!cancelled) {
                    setQrCodeUrl(url);
                    setGenError(false);
                }
            } catch {
                if (!cancelled) {
                    setQrCodeUrl('');
                    setGenError(true);
                }
            }
        }, 300);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [content, options]);

    const generateQR = async () => {
        if (!content) return;
        setIsGenerating(true);
        try {
            const url = await QRCode.toDataURL(content, {
                width: options.width,
                margin: options.margin,
                color: options.color,
                errorCorrectionLevel: options.errorCorrectionLevel,
            });
            setQrCodeUrl(url);
            setGenError(false);
            toast.success(tt.successToast);
        } catch (err) {
            console.error(err);
            setQrCodeUrl('');
            setGenError(true);
            toast.error(tt.failToast);
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadQR = () => {
        if (!qrCodeUrl) return;
        const slug = content
            .replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, '')
            .replace(/[^a-zA-Z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 40)
            .toLowerCase();
        const link = document.createElement('a');
        link.download = slug ? `qr-${slug}.png` : 'qrcode.png';
        link.href = qrCodeUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t.common.downloadStarted);
    };

    const copyQR = async () => {
        if (!qrCodeUrl) return;
        try {
            if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
                throw new Error('Clipboard API unsupported');
            }
            const blob = await (await fetch(qrCodeUrl)).blob();
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            toast.success(t.common.copied);
        } catch {
            toast.error(s.copyFailed);
        }
    };

    return (
        <ToolShell
            icon={<QrCode className="w-6 h-6" strokeWidth={2.1} />}
            title={tt.title}
            subtitle={tt.subtitle}
            kicker="QR"
            width="xwide"
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                    <ToolCard>
                        <div className="mb-6">
                            <SegmentedControl
                                value={activeTab}
                                onChange={setActiveTab}
                                options={[
                                    { value: 'url', label: `🔗  ${tt.tabUrl}` },
                                    { value: 'text', label: `✏️  ${tt.tabText}` },
                                ]}
                            />
                        </div>

                        <div className="space-y-6">
                            <div>
                                <FieldLabel hint={needsScheme ? s.httpsHint : undefined}>{tt.contentLabel}</FieldLabel>
                                <TextArea
                                    rows={5}
                                    placeholder={activeTab === 'url' ? tt.urlPlaceholder : tt.textPlaceholder}
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                            e.preventDefault();
                                            generateQR();
                                        }
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ColorField
                                    label={tt.fgColor}
                                    value={options.color.dark}
                                    onChange={(v) => setOptions((p) => ({ ...p, color: { ...p.color, dark: v } }))}
                                />
                                <ColorField
                                    label={tt.bgColor}
                                    value={options.color.light}
                                    onChange={(v) => setOptions((p) => ({ ...p, color: { ...p.color, light: v } }))}
                                />
                            </div>

                            {lowContrast && (
                                <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--color-accent-deep)]" role="alert">
                                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2.1} />
                                    {s.contrastWarning}
                                </p>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <FieldLabel hint="px">{s.sizeLabel}</FieldLabel>
                                    <SegmentedControl
                                        value={String(options.width)}
                                        onChange={(v) => setOptions((p) => ({ ...p, width: Number(v) }))}
                                        options={[
                                            { value: '512', label: '512' },
                                            { value: '1024', label: '1024' },
                                            { value: '2048', label: '2048' },
                                        ]}
                                    />
                                </div>
                                <div>
                                    <FieldLabel hint={s.ecHint}>{s.ecLabel}</FieldLabel>
                                    <SegmentedControl
                                        value={options.errorCorrectionLevel}
                                        onChange={(v) => setOptions((p) => ({ ...p, errorCorrectionLevel: v }))}
                                        options={[
                                            { value: 'L', label: 'L' },
                                            { value: 'M', label: 'M' },
                                            { value: 'Q', label: 'Q' },
                                            { value: 'H', label: 'H' },
                                        ]}
                                    />
                                </div>
                            </div>

                            <PrimaryButton onClick={generateQR} disabled={isGenerating || !content} className="w-full py-4">
                                {isGenerating ? (
                                    <>
                                        <Settings2 className="w-4 h-4 animate-spin" />
                                        {t.common.generating}
                                    </>
                                ) : (
                                    <>
                                        <QrCode className="w-4 h-4" />
                                        {tt.generate}
                                    </>
                                )}
                            </PrimaryButton>
                        </div>
                    </ToolCard>
                </div>

                <div className="lg:col-span-5">
                    <ToolCard className="h-full flex flex-col items-center justify-center text-center min-h-[420px]">
                        {qrCodeUrl ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                                className="w-full space-y-6"
                            >
                                <div className="bg-white p-6 rounded-2xl border-[1.5px] border-[var(--color-wine-100)] inline-block">
                                    <Image src={qrCodeUrl} alt="QR Code" width={300} height={300} className="w-full max-w-[240px] h-auto" unoptimized />
                                </div>
                                <div className="space-y-3">
                                    <SecondaryButton onClick={downloadQR} className="w-full py-3.5">
                                        <Download className="w-4 h-4" />
                                        {tt.downloadPng}
                                    </SecondaryButton>
                                    <SecondaryButton onClick={copyQR} className="w-full py-3.5">
                                        <Copy className="w-4 h-4" />
                                        {s.copyImage}
                                    </SecondaryButton>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="text-[var(--color-smoke-600)]">
                                <motion.div
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
                                    className="w-20 h-20 bg-[var(--color-wine-50)] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[var(--color-wine-100)]"
                                >
                                    <QrCode className="w-9 h-9 text-[var(--color-wine-300)]" />
                                </motion.div>
                                <p className="text-base font-semibold text-[var(--color-wine-700)] mb-1">{tt.emptyTitle}</p>
                                <p className="text-sm text-[var(--color-smoke-600)]">{genError ? s.tooLong : tt.emptyHint}</p>
                                {!genError && !trimmed && (
                                    <SecondaryButton
                                        onClick={() => {
                                            setActiveTab('url');
                                            setText('https://functions.codes');
                                        }}
                                        className="mt-5"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        {s.tryExample}
                                    </SecondaryButton>
                                )}
                            </div>
                        )}
                    </ToolCard>
                </div>
            </div>
        </ToolShell>
    );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <FieldLabel>{label}</FieldLabel>
            <div className="flex items-center gap-3">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    aria-label={label}
                    className="w-12 h-12 rounded-2xl cursor-pointer border-[1.5px] border-[var(--color-wine-100)] p-1 bg-white"
                />
                <span className="text-[12.5px] text-[var(--color-smoke-600)] uppercase font-mono">{value}</span>
            </div>
        </div>
    );
}
