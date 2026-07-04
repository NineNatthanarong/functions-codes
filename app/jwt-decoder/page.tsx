'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
    KeyRound, Copy, Trash2, ShieldAlert, AlertCircle, CheckCircle2,
    Braces, FileJson2, Fingerprint, Sparkles, Clock3,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, { FieldLabel, GhostButton, SecondaryButton, TextArea } from '@/components/ToolShell';

const EASE = [0.25, 1, 0.5, 1] as const;

/* ───────────────────────── i18n (local) ───────────────────────── */

const STRINGS = {
    th: {
        title: 'ถอดรหัส JWT',
        subtitle:
            'วางโทเคน JWT แล้วดู header, payload และ signature ได้ทันที พร้อมเช็ควันหมดอายุแบบอ่านง่าย — ทุกอย่างถอดรหัสในเบราว์เซอร์ของคุณ ไม่มีข้อมูลถูกส่งออกไปไหน',
        inputLabel: 'โทเคน JWT',
        inputHint: 'ตัด Bearer และช่องว่างให้อัตโนมัติ',
        placeholder: 'วางโทเคนที่นี่ เช่น eyJhbGciOi... หรือ Bearer eyJ... ก็ได้',
        sample: 'ลองตัวอย่าง',
        clear: 'ล้าง',
        note:
            'เครื่องมือนี้ถอดรหัสอย่างเดียว ไม่ได้ตรวจสอบลายเซ็น (signature) — และทุกอย่างทำงานในเบราว์เซอร์ของคุณ 100% ไม่มีโทเคนถูกส่งไปที่เซิร์ฟเวอร์ไหนทั้งนั้น',
        headerTitle: 'Header',
        payloadTitle: 'Payload',
        signatureTitle: 'Signature',
        copyHeader: 'คัดลอก header',
        copyPayload: 'คัดลอก payload',
        copySignature: 'คัดลอก signature',
        copiedToast: 'คัดลอกเรียบร้อย',
        copyFailedToast: 'คัดลอกไม่สำเร็จ ลองอีกครั้งนะ',
        sampleToast: 'ใส่โทเคนตัวอย่างให้แล้ว',
        emptyHint: 'ผลลัพธ์จะแสดงตรงนี้ทันทีที่วางโทเคน',
        badStructure: 'โทเคนไม่ครบ 3 ส่วน — JWT ต้องเป็น header.payload.signature คั่นด้วยจุด (ตอนนี้พบ {n} ส่วน)',
        errB64: 'ถอดรหัส base64url ไม่สำเร็จ — มีตัวอักษรแปลกปลอมหรือความยาวไม่ถูกต้อง',
        errJson: 'ถอดรหัส base64url ได้ แต่ข้างในไม่ใช่ JSON ที่ถูกต้อง',
        claimsTitle: 'Claims ที่รู้จัก',
        fullJson: 'JSON เต็ม',
        expired: 'หมดอายุแล้ว',
        validUntil: 'ใช้ได้ถึง',
        notYetValid: 'ยังไม่ถึงเวลาเริ่มใช้ (nbf)',
        noExp: 'ไม่มี exp — โทเคนไม่ระบุวันหมดอายุ',
        notVerified: 'ไม่ได้ตรวจสอบลายเซ็น',
        signatureDesc: 'ลายเซ็นดิบ (base64url) ที่แนบมากับโทเคน — แสดงให้ดูเท่านั้น ไม่ได้ยืนยันว่าถูกต้อง',
        signatureEmpty: 'โทเคนนี้ไม่มีลายเซ็น (อาจเป็น alg: none)',
        claims: {
            exp: 'หมดอายุ (exp)',
            iat: 'ออกให้เมื่อ (iat)',
            nbf: 'เริ่มใช้ได้ (nbf)',
            iss: 'ผู้ออกโทเคน (iss)',
            sub: 'เจ้าของโทเคน (sub)',
            aud: 'ผู้รับโทเคน (aud)',
        },
    },
    en: {
        title: 'JWT Decoder',
        subtitle:
            'Paste a JWT to instantly inspect its header, payload, and signature — with a human-readable expiry check. Everything is decoded right in your browser; nothing ever leaves this page.',
        inputLabel: 'JWT token',
        inputHint: 'Bearer prefix & whitespace are trimmed automatically',
        placeholder: 'Paste your token here — eyJhbGciOi... or Bearer eyJ... both work',
        sample: 'Try a sample',
        clear: 'Clear',
        note:
            'Decoding only — the signature is NOT verified. Everything runs 100% in your browser; your token is never sent to any server.',
        headerTitle: 'Header',
        payloadTitle: 'Payload',
        signatureTitle: 'Signature',
        copyHeader: 'Copy header',
        copyPayload: 'Copy payload',
        copySignature: 'Copy signature',
        copiedToast: 'Copied to clipboard',
        copyFailedToast: 'Copy failed — please try again',
        sampleToast: 'Sample token loaded',
        emptyHint: 'Results will appear here as soon as you paste a token',
        badStructure: 'Token does not have 3 parts — a JWT must be header.payload.signature separated by dots (found {n})',
        errB64: 'base64url decode failed — invalid characters or wrong length',
        errJson: 'base64url decoded fine, but the content is not valid JSON',
        claimsTitle: 'Recognized claims',
        fullJson: 'Full JSON',
        expired: 'EXPIRED',
        validUntil: 'Valid until',
        notYetValid: 'Not yet valid (nbf)',
        noExp: 'No exp — this token never expires',
        notVerified: 'Signature not verified',
        signatureDesc: 'The raw signature (base64url) attached to the token — shown as-is, this tool does not verify it.',
        signatureEmpty: 'This token has no signature (possibly alg: none)',
        claims: {
            exp: 'Expires (exp)',
            iat: 'Issued at (iat)',
            nbf: 'Not before (nbf)',
            iss: 'Issuer (iss)',
            sub: 'Subject (sub)',
            aud: 'Audience (aud)',
        },
    },
} as const;

/* ───────────────────────── decode helpers ───────────────────────── */

const SAMPLE_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzg0MTIiLCJuYW1lIjoiU29tY2hhaSBSYWtkZWUiLCJyb2xlIjoiYmFja2VuZC1kZXYiLCJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5kZXYiLCJhdWQiOiJmdW5jdGlvbnMuY29kZXMiLCJpYXQiOjE3NTE1OTA4MDAsImV4cCI6MTc1MTU5NDQwMH0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

function cleanToken(raw: string): string {
    let s = raw.trim();
    s = s.replace(/^Bearer\s+/i, '');
    s = s.replace(/^["']+|["',;]+$/g, '');
    s = s.replace(/\s+/g, '');
    return s;
}

/** Hand-rolled base64url → UTF-8 string (replace -_ chars, pad, TextDecoder). */
function base64UrlToUtf8(part: string): { ok: true; text: string } | { ok: false } {
    if (!/^[A-Za-z0-9_-]*$/.test(part)) return { ok: false };
    let b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const rem = b64.length % 4;
    if (rem === 1) return { ok: false };
    if (rem === 2) b64 += '==';
    if (rem === 3) b64 += '=';
    try {
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return { ok: true, text: new TextDecoder('utf-8', { fatal: true }).decode(bytes) };
    } catch {
        return { ok: false };
    }
}

type SectionResult =
    | { ok: true; json: string; value: unknown }
    | { ok: false; kind: 'base64' | 'json' };

function decodeSection(part: string): SectionResult {
    const b = base64UrlToUtf8(part);
    if (!b.ok) return { ok: false, kind: 'base64' };
    try {
        const value: unknown = JSON.parse(b.text);
        return { ok: true, value, json: JSON.stringify(value, null, 2) };
    } catch {
        return { ok: false, kind: 'json' };
    }
}

type Decoded =
    | { status: 'empty' }
    | { status: 'badStructure'; parts: number }
    | { status: 'decoded'; header: SectionResult; payload: SectionResult; signature: string; rawParts: string[] };

function decodeToken(raw: string): Decoded {
    const token = cleanToken(raw);
    if (!token) return { status: 'empty' };
    const parts = token.split('.');
    if (parts.length !== 3) return { status: 'badStructure', parts: parts.length };
    return {
        status: 'decoded',
        header: decodeSection(parts[0]),
        payload: decodeSection(parts[1]),
        signature: parts[2],
        rawParts: parts,
    };
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function numClaim(obj: Record<string, unknown> | null, key: string): number | null {
    if (!obj) return null;
    const v = obj[key];
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function strClaim(obj: Record<string, unknown> | null, key: string): string | null {
    if (!obj) return null;
    const v = obj[key];
    if (typeof v === 'string') return v;
    if (Array.isArray(v) && v.every((x) => typeof x === 'string')) return v.join(', ');
    return null;
}

function formatDateTime(ms: number, locale: 'th' | 'en'): string {
    return new Date(ms).toLocaleString(locale === 'th' ? 'th-TH' : 'en-GB', {
        dateStyle: 'medium',
        timeStyle: 'medium',
    });
}

function formatRelative(targetMs: number, nowMs: number, locale: 'th' | 'en'): string {
    const rtf = new Intl.RelativeTimeFormat(locale === 'th' ? 'th' : 'en', { numeric: 'auto' });
    const diff = Math.round((targetMs - nowMs) / 1000);
    const abs = Math.abs(diff);
    if (abs < 60) return rtf.format(diff, 'second');
    if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
    if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day');
    if (abs < 86400 * 365) return rtf.format(Math.round(diff / (86400 * 30)), 'month');
    return rtf.format(Math.round(diff / (86400 * 365)), 'year');
}

/* ───────────────────────── small UI pieces ───────────────────────── */

function CopyIconButton({ label, text, onCopied, onFailed }: {
    label: string;
    text: string;
    onCopied: () => void;
    onFailed: () => void;
}) {
    const copy = async () => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            onCopied();
        } catch {
            onFailed();
        }
    };
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={copy}
            disabled={!text}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-ink-3)] hover:text-[var(--color-ink-2)] hover:bg-[var(--color-surface-2)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 flex-shrink-0"
        >
            <Copy className="w-3.5 h-3.5" strokeWidth={2.1} />
        </button>
    );
}

function SectionError({ message }: { message: string }) {
    return (
        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-[#fbf3f4] border border-[#e6b3bd] text-[#a4364c] text-[13px] leading-relaxed">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={2.1} />
            <span>{message}</span>
        </div>
    );
}

function ClaimRow({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-2.5 border-b border-[var(--color-line)] last:border-b-0">
            <span className="w-44 flex-shrink-0 text-[11.5px] font-semibold tracking-[0.03em] uppercase text-[var(--color-ink-3)]">
                {label}
            </span>
            <div className="flex-1 min-w-0 text-[13px] text-[var(--color-ink-2)] break-all">{children}</div>
        </div>
    );
}

/* ───────────────────────── page ───────────────────────── */

export default function JwtDecoder() {
    const { locale } = useLanguage();
    const s = STRINGS[locale];

    const [input, setInput] = useState('');
    const [now, setNow] = useState<number | null>(null);

    useEffect(() => {
        setNow(Date.now());
        const id = setInterval(() => setNow(Date.now()), 15000);
        return () => clearInterval(id);
    }, []);

    const decoded = useMemo(() => decodeToken(input), [input]);

    const onCopied = () => toast.success(s.copiedToast);
    const onFailed = () => toast.error(s.copyFailedToast);

    const payloadObj =
        decoded.status === 'decoded' && decoded.payload.ok && isPlainObject(decoded.payload.value)
            ? decoded.payload.value
            : null;
    const headerObj =
        decoded.status === 'decoded' && decoded.header.ok && isPlainObject(decoded.header.value)
            ? decoded.header.value
            : null;

    const exp = numClaim(payloadObj, 'exp');
    const iat = numClaim(payloadObj, 'iat');
    const nbf = numClaim(payloadObj, 'nbf');
    const iss = strClaim(payloadObj, 'iss');
    const sub = strClaim(payloadObj, 'sub');
    const aud = strClaim(payloadObj, 'aud');
    const hasKnownClaims = [exp, iat, nbf].some((v) => v !== null) || [iss, sub, aud].some((v) => v !== null);

    const isExpired = exp !== null && now !== null && exp * 1000 <= now;
    const notYetValid = nbf !== null && now !== null && nbf * 1000 > now;

    const timeClaim = (value: number) => (
        <div className="flex flex-col gap-0.5">
            <span className="font-medium">{formatDateTime(value * 1000, locale)}</span>
            <span className="text-[12px] text-[var(--color-ink-3)]">
                {now !== null ? `${formatRelative(value * 1000, now, locale)} · ` : ''}
                <span className="font-mono">unix {value}</span>
            </span>
        </div>
    );

    return (
        <ToolShell
            icon={<KeyRound className="w-6 h-6" strokeWidth={2.1} />}
            title={s.title}
            subtitle={s.subtitle}
            kicker="JWT"
            width="wide"
        >
            {/* input */}
            <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-line)] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <FieldLabel hint={s.inputHint}>{s.inputLabel}</FieldLabel>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <SecondaryButton onClick={() => { setInput(SAMPLE_TOKEN); toast.success(s.sampleToast); }}>
                            <Sparkles className="w-3.5 h-3.5" />
                            {s.sample}
                        </SecondaryButton>
                        <GhostButton tone="danger" onClick={() => setInput('')} disabled={!input}>
                            <Trash2 className="w-3.5 h-3.5" />
                            {s.clear}
                        </GhostButton>
                    </div>
                </div>
                <TextArea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={s.placeholder}
                    rows={4}
                    spellCheck={false}
                    autoComplete="off"
                    className="font-mono !text-[12.5px] leading-relaxed"
                />
                {decoded.status === 'decoded' && (
                    <p className="mt-3 font-mono text-[11px] leading-relaxed break-all" aria-hidden>
                        <span className="text-[var(--color-accent-deep)]">{decoded.rawParts[0]}</span>
                        <span className="text-[var(--color-ink-4)]">.</span>
                        <span className="text-[var(--color-ink)]">{decoded.rawParts[1]}</span>
                        <span className="text-[var(--color-ink-4)]">.</span>
                        <span className="text-[var(--color-ink-3)]">{decoded.rawParts[2]}</span>
                    </p>
                )}
            </div>

            {/* privacy / not-verified note */}
            <div className="mt-4 flex items-start gap-3 p-4 rounded-2xl bg-[var(--color-accent-soft)] border border-[var(--color-line)]">
                <ShieldAlert className="w-4 h-4 mt-0.5 text-[var(--color-accent-deep)] flex-shrink-0" strokeWidth={2.1} />
                <p className="text-[13px] leading-relaxed text-[var(--color-ink)]">{s.note}</p>
            </div>

            {/* results */}
            <div className="mt-8">
                {decoded.status === 'empty' && (
                    <div className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl border border-dashed border-[var(--color-line-strong)] text-[var(--color-ink-4)]">
                        <KeyRound className="w-6 h-6" strokeWidth={1.8} />
                        <p className="text-[13.5px]">{s.emptyHint}</p>
                    </div>
                )}

                {decoded.status === 'badStructure' && (
                    <SectionError message={s.badStructure.replace('{n}', String(decoded.parts))} />
                )}

                {decoded.status === 'decoded' && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
                        {/* payload — first in DOM so it leads on mobile */}
                        <motion.div
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, ease: EASE }}
                            className="lg:col-span-3 lg:order-2 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-line)] border-t-[3px] border-t-[var(--color-ink)] p-5 sm:p-6"
                        >
                            <div className="flex items-center gap-2.5 mb-4">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-ink)] text-white flex-shrink-0">
                                    <Braces className="w-4 h-4" strokeWidth={2} />
                                </span>
                                <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--color-ink-2)] flex-1">
                                    {s.payloadTitle}
                                </h2>
                                {decoded.payload.ok && (
                                    <CopyIconButton label={s.copyPayload} text={decoded.payload.json} onCopied={onCopied} onFailed={onFailed} />
                                )}
                            </div>

                            {!decoded.payload.ok ? (
                                <SectionError
                                    message={`${s.payloadTitle}: ${decoded.payload.kind === 'base64' ? s.errB64 : s.errJson}`}
                                />
                            ) : (
                                <>
                                    {/* expiry badges */}
                                    {now !== null && (
                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            {exp !== null ? (
                                                isExpired ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fbf3f4] border border-[#e6b3bd] text-[#a4364c] text-[12px] font-semibold">
                                                        <AlertCircle className="w-3.5 h-3.5" strokeWidth={2.2} />
                                                        {s.expired} · {formatRelative(exp * 1000, now, locale)}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#eef5f0] border border-[#c4dbcb] text-[#3d6a4a] text-[12px] font-semibold">
                                                        <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.2} />
                                                        {s.validUntil} {formatDateTime(exp * 1000, locale)} · {formatRelative(exp * 1000, now, locale)}
                                                    </span>
                                                )
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-line)] text-[var(--color-ink-3)] text-[12px] font-semibold">
                                                    <Clock3 className="w-3.5 h-3.5" strokeWidth={2.2} />
                                                    {s.noExp}
                                                </span>
                                            )}
                                            {notYetValid && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-accent-soft)] border border-[var(--color-line)] text-[var(--color-accent-deep)] text-[12px] font-semibold">
                                                    <Clock3 className="w-3.5 h-3.5" strokeWidth={2.2} />
                                                    {s.notYetValid}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* humanized claims */}
                                    {hasKnownClaims && (
                                        <div className="mb-5">
                                            <p className="kicker text-[var(--color-ink-3)] mb-1">{s.claimsTitle}</p>
                                            <div>
                                                {exp !== null && <ClaimRow label={s.claims.exp}>{timeClaim(exp)}</ClaimRow>}
                                                {iat !== null && <ClaimRow label={s.claims.iat}>{timeClaim(iat)}</ClaimRow>}
                                                {nbf !== null && <ClaimRow label={s.claims.nbf}>{timeClaim(nbf)}</ClaimRow>}
                                                {iss !== null && <ClaimRow label={s.claims.iss}><span className="font-mono text-[12.5px]">{iss}</span></ClaimRow>}
                                                {sub !== null && <ClaimRow label={s.claims.sub}><span className="font-mono text-[12.5px]">{sub}</span></ClaimRow>}
                                                {aud !== null && <ClaimRow label={s.claims.aud}><span className="font-mono text-[12.5px]">{aud}</span></ClaimRow>}
                                            </div>
                                        </div>
                                    )}

                                    <p className="kicker text-[var(--color-ink-3)] mb-2">{s.fullJson}</p>
                                    <pre className="p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-line)] font-mono text-[12.5px] leading-relaxed text-[var(--color-ink-2)] overflow-x-auto whitespace-pre-wrap break-all">
                                        {decoded.payload.json}
                                    </pre>
                                </>
                            )}
                        </motion.div>

                        {/* header + signature */}
                        <div className="lg:col-span-2 lg:order-1 flex flex-col gap-5">
                            <motion.div
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.45, ease: EASE, delay: 0.06 }}
                                className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-line)] border-t-[3px] border-t-[var(--color-accent)] p-5 sm:p-6"
                            >
                                <div className="flex items-center gap-2.5 mb-4">
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent-deep)] flex-shrink-0">
                                        <FileJson2 className="w-4 h-4" strokeWidth={2} />
                                    </span>
                                    <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--color-ink-2)] flex-1">
                                        {s.headerTitle}
                                    </h2>
                                    {decoded.header.ok && (
                                        <CopyIconButton label={s.copyHeader} text={decoded.header.json} onCopied={onCopied} onFailed={onFailed} />
                                    )}
                                </div>

                                {!decoded.header.ok ? (
                                    <SectionError
                                        message={`${s.headerTitle}: ${decoded.header.kind === 'base64' ? s.errB64 : s.errJson}`}
                                    />
                                ) : (
                                    <>
                                        {headerObj && (typeof headerObj.alg === 'string' || typeof headerObj.typ === 'string') && (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {typeof headerObj.alg === 'string' && (
                                                    <span className="px-2.5 py-1 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-line)] font-mono text-[11.5px] text-[var(--color-ink)]">
                                                        alg: {headerObj.alg}
                                                    </span>
                                                )}
                                                {typeof headerObj.typ === 'string' && (
                                                    <span className="px-2.5 py-1 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-line)] font-mono text-[11.5px] text-[var(--color-ink)]">
                                                        typ: {headerObj.typ}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <pre className="p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-line)] font-mono text-[12.5px] leading-relaxed text-[var(--color-ink-2)] overflow-x-auto whitespace-pre-wrap break-all">
                                            {decoded.header.json}
                                        </pre>
                                    </>
                                )}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.45, ease: EASE, delay: 0.12 }}
                                className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-line)] border-t-[3px] border-t-[var(--color-line-strong)] p-5 sm:p-6"
                            >
                                <div className="flex items-center gap-2.5 mb-4">
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-surface-2)] text-[var(--color-ink-3)] flex-shrink-0">
                                        <Fingerprint className="w-4 h-4" strokeWidth={2} />
                                    </span>
                                    <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--color-ink-2)] flex-1">
                                        {s.signatureTitle}
                                    </h2>
                                    <CopyIconButton label={s.copySignature} text={decoded.signature} onCopied={onCopied} onFailed={onFailed} />
                                </div>

                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-accent-soft)] border border-[var(--color-line)] text-[var(--color-accent-deep)] text-[12px] font-semibold mb-4">
                                    <ShieldAlert className="w-3.5 h-3.5" strokeWidth={2.2} />
                                    {s.notVerified}
                                </span>

                                {decoded.signature ? (
                                    <pre className="p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-line)] font-mono text-[12.5px] leading-relaxed text-[var(--color-ink-2)] overflow-x-auto whitespace-pre-wrap break-all">
                                        {decoded.signature}
                                    </pre>
                                ) : (
                                    <p className="text-[13px] text-[var(--color-ink-3)]">{s.signatureEmpty}</p>
                                )}

                                <p className="mt-3 text-[12px] leading-relaxed text-[var(--color-ink-3)]">{s.signatureDesc}</p>
                            </motion.div>
                        </div>
                    </div>
                )}
            </div>
        </ToolShell>
    );
}
