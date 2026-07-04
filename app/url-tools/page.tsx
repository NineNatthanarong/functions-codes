'use client';

import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Link2,
    Copy,
    Trash2,
    Plus,
    X,
    AlertCircle,
    ArrowRightLeft,
    ScanSearch,
    Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, {
    ToolCard,
    SecondaryButton,
    GhostButton,
    FieldLabel,
    TextInput,
    TextArea,
    SegmentedControl,
} from '@/components/ToolShell';

const EASE = [0.25, 1, 0.5, 1] as const;

const STRINGS = {
    th: {
        kicker: 'URL Toolkit',
        title: 'เครื่องมือ URL',
        subtitle:
            'เข้ารหัส-ถอดรหัส URL และแกะโครงสร้างลิงก์ยาว ๆ ให้อ่านง่าย แก้พารามิเตอร์แล้วประกอบกลับได้ทันที ทำงานในเบราว์เซอร์ทั้งหมด ไม่ส่งข้อมูลไปไหน',
        tabCodec: 'เข้ารหัส / ถอดรหัส',
        tabInspect: 'แกะโครงสร้าง URL',
        modeHintComponent: 'เข้ารหัสอักขระพิเศษทุกตัว (รวม / ? & =) — เหมาะกับ "ค่า" ของพารามิเตอร์',
        modeHintUri: 'คงเครื่องหมาย / ? & = ไว้ — เหมาะกับการเข้ารหัส URL ทั้งเส้น',
        plainLabel: 'ข้อความปกติ',
        plainPlaceholder: 'พิมพ์ข้อความที่นี่ ภาษาไทยก็เข้ารหัสได้ เช่น สวัสดี…',
        encodedLabel: 'ผลลัพธ์ที่เข้ารหัสแล้ว',
        encodedHint: 'เช่น ก → %E0%B8%81',
        encodedPlaceholder: 'หรือวางข้อความที่เข้ารหัสแล้วที่นี่ เพื่อถอดรหัสกลับ…',
        thaiExample: 'ลองตัวอย่างภาษาไทย',
        thaiExampleText: 'สวัสดีครับ ยินดีต้อนรับสู่กรุงเทพฯ 100%',
        decodeError: 'ถอดรหัสไม่ได้ — รูปแบบ % ไม่ถูกต้อง ลองเช็กว่าคัดลอกข้อความมาครบ',
        copy: 'คัดลอก',
        copied: 'คัดลอกเรียบร้อย',
        copyFailed: 'คัดลอกไม่สำเร็จ ลองอีกครั้ง',
        clear: 'ล้างข้อมูล',
        urlLabel: 'วาง URL เต็ม ๆ ที่นี่',
        urlPlaceholder: 'https://example.com/page?utm_source=facebook&utm_medium=cpc…',
        urlError: 'URL นี้อ่านไม่ออก — อย่าลืมใส่ http:// หรือ https:// นำหน้า',
        tryUtm: 'ลองตัวอย่างลิงก์ UTM',
        emptyInspect:
            'วางลิงก์ยาว ๆ ที่อยากรู้ว่าข้างในมีอะไร เช่น ลิงก์ UTM จากแคมเปญโฆษณา หรือ callback URL ที่กำลังดีบักอยู่',
        breakdown: 'โครงสร้าง URL',
        protocol: 'โปรโตคอล',
        host: 'โฮสต์',
        port: 'พอร์ต',
        path: 'พาธ',
        hash: 'แฮช (#)',
        portDefault: 'ค่าเริ่มต้น',
        paramsTitle: 'พารามิเตอร์ (Query string)',
        noParams: 'ลิงก์นี้ยังไม่มีพารามิเตอร์ — กดเพิ่มได้เลย',
        addParam: 'เพิ่มพารามิเตอร์',
        keyPlaceholder: 'ชื่อ เช่น utm_source',
        valuePlaceholder: 'ค่า',
        removeParam: 'ลบพารามิเตอร์',
        rebuiltLabel: 'URL ที่ประกอบใหม่',
        copyUrl: 'คัดลอก URL',
    },
    en: {
        kicker: 'URL Toolkit',
        title: 'URL Tools',
        subtitle:
            'Encode and decode URLs, then dissect long links into a readable breakdown. Edit query params and rebuild the URL instantly. Everything runs in your browser — nothing is uploaded.',
        tabCodec: 'Encode / Decode',
        tabInspect: 'URL Inspector',
        modeHintComponent: 'Encodes every special character (including / ? & =) — best for parameter values',
        modeHintUri: 'Keeps / ? & = intact — best for encoding a whole URL',
        plainLabel: 'Plain text',
        plainPlaceholder: 'Type text here — Thai works too, e.g. สวัสดี…',
        encodedLabel: 'Encoded result',
        encodedHint: 'e.g. ก → %E0%B8%81',
        encodedPlaceholder: 'Or paste encoded text here to decode it back…',
        thaiExample: 'Try a Thai example',
        thaiExampleText: 'สวัสดีครับ ยินดีต้อนรับสู่กรุงเทพฯ 100%',
        decodeError: 'Could not decode — invalid % sequence. Check that the text was copied completely.',
        copy: 'Copy',
        copied: 'Copied to clipboard',
        copyFailed: 'Copy failed, please try again',
        clear: 'Clear',
        urlLabel: 'Paste a full URL here',
        urlPlaceholder: 'https://example.com/page?utm_source=facebook&utm_medium=cpc…',
        urlError: 'This URL cannot be parsed — make sure it starts with http:// or https://',
        tryUtm: 'Try a UTM link example',
        emptyInspect:
            'Paste any long link you want to dissect — a UTM link from an ad campaign, or a callback URL you are debugging.',
        breakdown: 'URL breakdown',
        protocol: 'Protocol',
        host: 'Host',
        port: 'Port',
        path: 'Path',
        hash: 'Hash (#)',
        portDefault: 'default',
        paramsTitle: 'Query parameters',
        noParams: 'No parameters on this link yet — add one below.',
        addParam: 'Add parameter',
        keyPlaceholder: 'Name, e.g. utm_source',
        valuePlaceholder: 'Value',
        removeParam: 'Remove parameter',
        rebuiltLabel: 'Rebuilt URL',
        copyUrl: 'Copy URL',
    },
} as const;

const SAMPLE_UTM =
    'https://example.com/summer-sale?utm_source=facebook&utm_medium=cpc&utm_campaign=summer_sale&utm_content=%E0%B9%82%E0%B8%9B%E0%B8%A3%E0%B8%A1%E0%B8%8A%E0%B8%B1%E0%B9%88%E0%B8%99#pricing';

type Tab = 'codec' | 'inspect';
type Mode = 'component' | 'uri';
type Param = { id: number; key: string; value: string };
type ParsedInfo = {
    base: string;
    protocol: string;
    hostname: string;
    port: string;
    pathname: string;
    hash: string;
};

const DEFAULT_PORTS: Record<string, string> = { 'http:': '80', 'https:': '443' };

export default function UrlTools() {
    const { locale } = useLanguage();
    const s = STRINGS[locale];

    const [tab, setTab] = useState<Tab>('codec');

    /* ── section 1 · encode / decode ── */
    const [mode, setMode] = useState<Mode>('component');
    const [plain, setPlain] = useState('');
    const [encoded, setEncoded] = useState('');
    const [decodeFailed, setDecodeFailed] = useState(false);

    /* ── section 2 · inspector ── */
    const [rawUrl, setRawUrl] = useState('');
    const [parsed, setParsed] = useState<ParsedInfo | null>(null);
    const [params, setParams] = useState<Param[]>([]);
    const [urlInvalid, setUrlInvalid] = useState(false);
    const idRef = useRef(0);
    const nextId = () => ++idRef.current;

    const copyText = async (text: string) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            toast.success(s.copied);
        } catch {
            toast.error(s.copyFailed);
        }
    };

    /* ── encode / decode handlers ── */
    const encodeWith = (m: Mode, value: string) =>
        m === 'component' ? encodeURIComponent(value) : encodeURI(value);
    const decodeWith = (m: Mode, value: string) =>
        m === 'component' ? decodeURIComponent(value) : decodeURI(value);

    const handlePlainChange = (v: string) => {
        setPlain(v);
        setDecodeFailed(false);
        try {
            setEncoded(encodeWith(mode, v));
        } catch {
            /* lone surrogates — leave encoded side as-is */
        }
    };

    const handleEncodedChange = (v: string) => {
        setEncoded(v);
        try {
            setPlain(decodeWith(mode, v));
            setDecodeFailed(false);
        } catch {
            setDecodeFailed(v.trim().length > 0);
        }
    };

    const handleModeChange = (m: Mode) => {
        setMode(m);
        if (plain && !decodeFailed) {
            try {
                setEncoded(encodeWith(m, plain));
            } catch {
                /* ignore */
            }
        }
    };

    const clearCodec = () => {
        setPlain('');
        setEncoded('');
        setDecodeFailed(false);
    };

    /* ── inspector handlers ── */
    const handleUrlChange = (v: string) => {
        setRawUrl(v);
        const trimmed = v.trim();
        if (!trimmed) {
            setParsed(null);
            setParams([]);
            setUrlInvalid(false);
            return;
        }
        try {
            const u = new URL(trimmed);
            setParsed({
                base: u.href,
                protocol: u.protocol,
                hostname: u.hostname,
                port: u.port,
                pathname: u.pathname,
                hash: u.hash,
            });
            setParams(
                Array.from(u.searchParams.entries()).map(([key, value]) => ({
                    id: nextId(),
                    key,
                    value,
                }))
            );
            setUrlInvalid(false);
        } catch {
            setParsed(null);
            setParams([]);
            setUrlInvalid(true);
        }
    };

    const updateParam = (id: number, field: 'key' | 'value', v: string) =>
        setParams((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: v } : p)));
    const removeParam = (id: number) => setParams((prev) => prev.filter((p) => p.id !== id));
    const addParam = () => setParams((prev) => [...prev, { id: nextId(), key: '', value: '' }]);

    const rebuiltUrl = useMemo(() => {
        if (!parsed) return '';
        try {
            const u = new URL(parsed.base);
            const sp = new URLSearchParams();
            for (const p of params) {
                if (p.key.trim() !== '') sp.append(p.key, p.value);
            }
            u.search = sp.toString();
            return u.toString();
        } catch {
            return '';
        }
    }, [parsed, params]);

    const portDisplay = parsed
        ? parsed.port ||
          (DEFAULT_PORTS[parsed.protocol]
              ? `${DEFAULT_PORTS[parsed.protocol]} (${s.portDefault})`
              : '—')
        : '';

    return (
        <ToolShell
            icon={<Link2 className="w-6 h-6" strokeWidth={2.1} />}
            title={s.title}
            subtitle={s.subtitle}
            kicker={s.kicker}
            width="wide"
            actions={
                <SegmentedControl<Tab>
                    options={[
                        { value: 'codec', label: s.tabCodec },
                        { value: 'inspect', label: s.tabInspect },
                    ]}
                    value={tab}
                    onChange={setTab}
                />
            }
        >
            {tab === 'codec' ? (
                <motion.div
                    key="codec"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: EASE }}
                >
                    <ToolCard>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
                            <SegmentedControl<Mode>
                                options={[
                                    { value: 'component', label: 'encodeURIComponent' },
                                    { value: 'uri', label: 'encodeURI' },
                                ]}
                                value={mode}
                                onChange={handleModeChange}
                            />
                            <div className="flex items-center gap-2">
                                <SecondaryButton onClick={() => handlePlainChange(s.thaiExampleText)}>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    {s.thaiExample}
                                </SecondaryButton>
                                <GhostButton
                                    tone="danger"
                                    onClick={clearCodec}
                                    disabled={!plain && !encoded}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {s.clear}
                                </GhostButton>
                            </div>
                        </div>

                        <p className="text-[12.5px] text-[var(--color-ink-3)] mb-6 leading-[1.55]">
                            {mode === 'component' ? s.modeHintComponent : s.modeHintUri}
                        </p>

                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 lg:gap-3 items-stretch">
                            <div>
                                <FieldLabel>{s.plainLabel}</FieldLabel>
                                <TextArea
                                    value={plain}
                                    onChange={(e) => handlePlainChange(e.target.value)}
                                    placeholder={s.plainPlaceholder}
                                    rows={9}
                                    className="h-56"
                                />
                                <div className="mt-2 flex justify-end">
                                    <GhostButton onClick={() => copyText(plain)} disabled={!plain}>
                                        <Copy className="w-3.5 h-3.5" />
                                        {s.copy}
                                    </GhostButton>
                                </div>
                            </div>

                            <div className="hidden lg:flex items-center justify-center px-1">
                                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-ink-2)]">
                                    <ArrowRightLeft className="w-4 h-4" strokeWidth={2.1} />
                                </span>
                            </div>

                            <div>
                                <FieldLabel hint={s.encodedHint}>{s.encodedLabel}</FieldLabel>
                                <TextArea
                                    value={encoded}
                                    onChange={(e) => handleEncodedChange(e.target.value)}
                                    placeholder={s.encodedPlaceholder}
                                    rows={9}
                                    className="h-56 font-mono"
                                />
                                <div className="mt-2 flex items-center justify-between gap-3">
                                    {decodeFailed ? (
                                        <span className="inline-flex items-start gap-1.5 text-[12px] text-[#d62828] leading-[1.4]">
                                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                            {s.decodeError}
                                        </span>
                                    ) : (
                                        <span />
                                    )}
                                    <GhostButton onClick={() => copyText(encoded)} disabled={!encoded}>
                                        <Copy className="w-3.5 h-3.5" />
                                        {s.copy}
                                    </GhostButton>
                                </div>
                            </div>
                        </div>
                    </ToolCard>
                </motion.div>
            ) : (
                <motion.div
                    key="inspect"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: EASE }}
                    className="flex flex-col gap-5"
                >
                    <ToolCard>
                        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                            <div className="flex-1 min-w-0">
                                <FieldLabel>{s.urlLabel}</FieldLabel>
                                <TextInput
                                    value={rawUrl}
                                    onChange={(e) => handleUrlChange(e.target.value)}
                                    placeholder={s.urlPlaceholder}
                                    spellCheck={false}
                                    className="font-mono"
                                />
                            </div>
                            <SecondaryButton onClick={() => handleUrlChange(SAMPLE_UTM)}>
                                <Sparkles className="w-3.5 h-3.5" />
                                {s.tryUtm}
                            </SecondaryButton>
                        </div>

                        {urlInvalid && (
                            <motion.p
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease: EASE }}
                                className="mt-3 inline-flex items-start gap-1.5 text-[12.5px] text-[#d62828] leading-[1.5]"
                            >
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                {s.urlError}
                            </motion.p>
                        )}

                        {!rawUrl.trim() && !parsed && (
                            <p className="mt-3 inline-flex items-start gap-2 text-[13px] text-[var(--color-ink-3)] leading-[1.55]">
                                <ScanSearch className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--color-ink-4)]" />
                                {s.emptyInspect}
                            </p>
                        )}
                    </ToolCard>

                    {parsed && (
                        <>
                            <ToolCard>
                                <p className="kicker text-[var(--color-ink-3)] mb-5">{s.breakdown}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    <PartCell label={s.protocol} value={parsed.protocol.replace(/:$/, '')} />
                                    <PartCell label={s.host} value={parsed.hostname} />
                                    <PartCell label={s.port} value={portDisplay} />
                                    <PartCell label={s.path} value={parsed.pathname} />
                                    <PartCell label={s.hash} value={parsed.hash} />
                                </div>
                            </ToolCard>

                            <ToolCard>
                                <div className="flex items-center justify-between mb-5">
                                    <p className="kicker text-[var(--color-ink-3)]">{s.paramsTitle}</p>
                                    <SecondaryButton onClick={addParam}>
                                        <Plus className="w-3.5 h-3.5" />
                                        {s.addParam}
                                    </SecondaryButton>
                                </div>

                                {params.length === 0 ? (
                                    <p className="text-[13px] text-[var(--color-ink-3)]">{s.noParams}</p>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {params.map((p) => (
                                            <div
                                                key={p.id}
                                                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-2 items-center"
                                            >
                                                <TextInput
                                                    value={p.key}
                                                    onChange={(e) => updateParam(p.id, 'key', e.target.value)}
                                                    placeholder={s.keyPlaceholder}
                                                    spellCheck={false}
                                                    className="font-mono !h-10 !text-[13px]"
                                                />
                                                <TextInput
                                                    value={p.value}
                                                    onChange={(e) => updateParam(p.id, 'value', e.target.value)}
                                                    placeholder={s.valuePlaceholder}
                                                    spellCheck={false}
                                                    className="font-mono !h-10 !text-[13px]"
                                                />
                                                <button
                                                    onClick={() => removeParam(p.id)}
                                                    aria-label={s.removeParam}
                                                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-[var(--color-ink-3)] hover:text-[#d62828] hover:bg-[#fde5e5] transition-colors duration-200"
                                                >
                                                    <X className="w-4 h-4" strokeWidth={2.2} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-6 pt-5 border-t border-[var(--color-line)]">
                                    <div className="flex items-center justify-between mb-2">
                                        <FieldLabel>{s.rebuiltLabel}</FieldLabel>
                                        <GhostButton onClick={() => copyText(rebuiltUrl)} disabled={!rebuiltUrl}>
                                            <Copy className="w-3.5 h-3.5" />
                                            {s.copyUrl}
                                        </GhostButton>
                                    </div>
                                    <div className="rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-line)] px-4 py-3.5 font-mono text-[13px] text-[var(--color-ink-2)] break-all leading-[1.6]">
                                        {rebuiltUrl || '—'}
                                    </div>
                                </div>
                            </ToolCard>
                        </>
                    )}
                </motion.div>
            )}
        </ToolShell>
    );
}

function PartCell({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-[var(--color-line)] bg-white px-4 py-3">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-ink-3)] mb-1.5">
                {label}
            </div>
            <div className="font-mono text-[13px] text-[var(--color-ink-2)] break-all leading-[1.5]">
                {value || '—'}
            </div>
        </div>
    );
}
