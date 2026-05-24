'use client';

import { useState } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
import { Download, QrCode, Settings2, Link as LinkIcon, Type } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, FieldLabel, TextArea, PrimaryButton, SecondaryButton, SegmentedControl } from '@/components/ToolShell';

export default function QRGenerator() {
    const t = useT();
    const tt = t.pages.qr;
    const [text, setText] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<'url' | 'text'>('url');
    const [options, setOptions] = useState({
        width: 1024,
        margin: 2,
        color: { dark: '#552834', light: '#FAF6F3' },
        errorCorrectionLevel: 'M' as 'L' | 'M' | 'Q' | 'H',
    });

    const generateQR = async () => {
        if (!text.trim()) return;
        setIsGenerating(true);
        try {
            const url = await QRCode.toDataURL(text, {
                width: options.width,
                margin: options.margin,
                color: options.color,
                errorCorrectionLevel: options.errorCorrectionLevel,
            });
            setQrCodeUrl(url);
            toast.success(tt.successToast);
        } catch (err) {
            console.error(err);
            toast.error(tt.failToast);
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadQR = () => {
        if (!qrCodeUrl) return;
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = qrCodeUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t.common.downloadStarted);
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
                                <FieldLabel>{tt.contentLabel}</FieldLabel>
                                <TextArea
                                    rows={5}
                                    placeholder={activeTab === 'url' ? tt.urlPlaceholder : tt.textPlaceholder}
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
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

                            <PrimaryButton onClick={generateQR} disabled={isGenerating || !text.trim()} className="w-full py-4">
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
                                <SecondaryButton onClick={downloadQR} className="w-full py-3.5">
                                    <Download className="w-4 h-4" />
                                    {tt.downloadPng}
                                </SecondaryButton>
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
                                <p className="text-sm text-[var(--color-smoke-600)]">{tt.emptyHint}</p>
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
                    className="w-12 h-12 rounded-2xl cursor-pointer border-[1.5px] border-[var(--color-wine-100)] p-1 bg-white"
                />
                <span className="text-[12.5px] text-[var(--color-smoke-600)] uppercase font-mono">{value}</span>
            </div>
        </div>
    );
}
