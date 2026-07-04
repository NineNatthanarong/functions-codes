'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Table, Upload, Download, Copy, Trash2, CheckCircle, AlertCircle,
    FileJson, FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, { GhostButton, SegmentedControl } from '@/components/ToolShell';
import { parseCsv, toCsv, coerceValue, jsonToTable, cellToString, type CsvErrorCode, type JsonShapeError } from './csv';

const EASE = [0.25, 1, 0.5, 1] as const;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const PREVIEW_ROWS = 10;

type Direction = 'csv2json' | 'json2csv';
type Delim = ',' | ';' | '\t';

type PreviewState = {
    header: string[] | null;
    rows: string[][];
    total: number;
};

type ErrorState =
    | { kind: 'csv'; row: number; col: number; code: CsvErrorCode }
    | { kind: 'json'; line?: number; col?: number; raw: string }
    | { kind: 'shape'; code: JsonShapeError };

const STRINGS = {
    th: {
        kicker: 'CSV ↔ JSON',
        title: 'แปลง CSV ↔ JSON',
        subtitle:
            'วาง CSV จาก Excel หรือ JSON จาก API แล้วระบบแปลงให้ทันทีที่พิมพ์ รองรับช่องที่มีเครื่องหมายคำพูด ขึ้นบรรทัดใหม่ในเซลล์ และตัวคั่นหลายแบบ ทุกอย่างทำงานในเบราว์เซอร์ ข้อมูลไม่ถูกส่งไปไหน',
        dirCsvJson: 'CSV → JSON',
        dirJsonCsv: 'JSON → CSV',
        delimiterLabel: 'ตัวคั่น',
        delimComma: 'คอมมา ,',
        delimSemicolon: 'เซมิโคลอน ;',
        delimTab: 'แท็บ',
        headerToggle: 'แถวแรกเป็นหัวตาราง',
        coerceToggle: 'แปลงตัวเลข/บูลีนอัตโนมัติ',
        inputCsv: 'ข้อมูล CSV',
        inputJson: 'ข้อมูล JSON',
        outputCsv: 'ผลลัพธ์ CSV',
        outputJson: 'ผลลัพธ์ JSON',
        placeholderCsv:
            'วาง CSV ที่นี่ หรืออัปโหลดไฟล์...\n\nname,email,age\nสมชาย,somchai@example.com,28\nสมหญิง,somying@example.com,25',
        placeholderJson:
            'วาง JSON ที่นี่ (อาเรย์ของออบเจ็กต์ หรืออาเรย์ของอาเรย์)...\n\n[\n  { "name": "สมชาย", "age": 28 },\n  { "name": "สมหญิง", "age": 25 }\n]',
        upload: 'อัปโหลดไฟล์',
        download: 'ดาวน์โหลด',
        copy: 'คัดลอก',
        clear: 'ล้าง',
        copied: 'คัดลอกเรียบร้อย',
        copyFailed: 'คัดลอกไม่สำเร็จ ลองอีกครั้ง',
        downloaded: 'ดาวน์โหลดเรียบร้อย',
        fileLoaded: 'อ่านไฟล์เรียบร้อย',
        fileTooBig: 'ไฟล์ใหญ่เกิน 5 MB',
        fileReadError: 'อ่านไฟล์ไม่สำเร็จ',
        statusOk: 'แปลงแล้ว {n} แถว',
        invalid: 'มีข้อผิดพลาด',
        previewTitle: 'ตัวอย่างตาราง',
        previewHint: 'แสดง {shown} จาก {total} แถว',
        errUnclosed: 'เครื่องหมายคำพูด (") ไม่ถูกปิด — เริ่มที่แถว {row} คอลัมน์ {col}',
        errAfterQuote: 'มีตัวอักษรเกินหลังเครื่องหมายคำพูดปิด — แถว {row} คอลัมน์ {col}',
        errJson: 'JSON ไม่ถูกต้อง',
        errJsonAt: 'JSON ไม่ถูกต้อง — บรรทัด {row} ตำแหน่ง {col}',
        errNotArray: 'JSON ต้องเป็นอาเรย์ เช่น [{"a":1}] หรือ [[1,2]]',
        errEmpty: 'อาเรย์ว่าง — ไม่มีข้อมูลให้แปลง',
        errMixed: 'สมาชิกในอาเรย์ต้องเป็นออบเจ็กต์ทั้งหมด หรือเป็นอาเรย์ทั้งหมด',
    },
    en: {
        kicker: 'CSV ↔ JSON',
        title: 'CSV ↔ JSON Converter',
        subtitle:
            'Paste CSV from Excel or JSON from an API and it converts live as you type. Handles quoted fields, newlines inside cells, and custom delimiters. Everything runs in your browser — nothing gets uploaded.',
        dirCsvJson: 'CSV → JSON',
        dirJsonCsv: 'JSON → CSV',
        delimiterLabel: 'Delimiter',
        delimComma: 'Comma ,',
        delimSemicolon: 'Semicolon ;',
        delimTab: 'Tab',
        headerToggle: 'First row is header',
        coerceToggle: 'Auto-convert numbers/booleans',
        inputCsv: 'CSV input',
        inputJson: 'JSON input',
        outputCsv: 'CSV output',
        outputJson: 'JSON output',
        placeholderCsv:
            'Paste CSV here or upload a file...\n\nname,email,age\nAlice,alice@example.com,28\nBob,bob@example.com,25',
        placeholderJson:
            'Paste JSON here (array of objects or array of arrays)...\n\n[\n  { "name": "Alice", "age": 28 },\n  { "name": "Bob", "age": 25 }\n]',
        upload: 'Upload file',
        download: 'Download',
        copy: 'Copy',
        clear: 'Clear',
        copied: 'Copied to clipboard',
        copyFailed: 'Copy failed, please try again',
        downloaded: 'Download started',
        fileLoaded: 'File loaded',
        fileTooBig: 'File is larger than 5 MB',
        fileReadError: 'Could not read the file',
        statusOk: '{n} rows converted',
        invalid: 'Error found',
        previewTitle: 'Table preview',
        previewHint: 'showing {shown} of {total} rows',
        errUnclosed: 'Unclosed quote (") — starts at row {row}, column {col}',
        errAfterQuote: 'Unexpected character after closing quote — row {row}, column {col}',
        errJson: 'Invalid JSON',
        errJsonAt: 'Invalid JSON — line {row}, column {col}',
        errNotArray: 'JSON must be an array, e.g. [{"a":1}] or [[1,2]]',
        errEmpty: 'Empty array — nothing to convert',
        errMixed: 'Array items must be all objects or all arrays',
    },
} as const;

export default function CsvJsonConverter() {
    const { locale } = useLanguage();
    const s = STRINGS[locale];

    const [direction, setDirection] = useState<Direction>('csv2json');
    const [delimiter, setDelimiter] = useState<Delim>(',');
    const [hasHeader, setHasHeader] = useState(true);
    const [coerce, setCoerce] = useState(true);

    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState<ErrorState | null>(null);
    const [preview, setPreview] = useState<PreviewState | null>(null);
    const [rowCount, setRowCount] = useState(0);

    const fileRef = useRef<HTMLInputElement>(null);

    const convert = useCallback(() => {
        if (!input.trim()) {
            setOutput('');
            setError(null);
            setPreview(null);
            setRowCount(0);
            return;
        }

        if (direction === 'csv2json') {
            const { rows, error: parseError } = parseCsv(input, delimiter);
            if (parseError) {
                setError({ kind: 'csv', row: parseError.row, col: parseError.col, code: parseError.code });
                setOutput('');
                setPreview(null);
                setRowCount(0);
                return;
            }
            if (hasHeader) {
                const rawHeader = rows[0] ?? [];
                const dataRows = rows.slice(1);
                const seen = new Map<string, number>();
                const keys = rawHeader.map((h, idx) => {
                    let key = h.trim() === '' ? `field${idx + 1}` : h;
                    const count = seen.get(key) ?? 0;
                    seen.set(key, count + 1);
                    if (count > 0) key = `${key}_${count + 1}`;
                    return key;
                });
                const maxLen = dataRows.reduce((max, r) => Math.max(max, r.length), keys.length);
                for (let k = keys.length; k < maxLen; k++) keys.push(`field${k + 1}`);

                const objects = dataRows.map((r) => {
                    const obj: Record<string, unknown> = {};
                    keys.forEach((key, idx) => {
                        const raw = idx < r.length ? r[idx] : '';
                        obj[key] = coerce ? coerceValue(raw) : raw;
                    });
                    return obj;
                });
                setOutput(JSON.stringify(objects, null, 2));
                setPreview({ header: keys, rows: dataRows.slice(0, PREVIEW_ROWS), total: dataRows.length });
                setRowCount(dataRows.length);
            } else {
                const arrays = rows.map((r) => r.map((cell) => (coerce ? coerceValue(cell) : cell)));
                setOutput(JSON.stringify(arrays, null, 2));
                setPreview({ header: null, rows: rows.slice(0, PREVIEW_ROWS), total: rows.length });
                setRowCount(rows.length);
            }
            setError(null);
            return;
        }

        // JSON -> CSV
        let parsed: unknown;
        try {
            parsed = JSON.parse(input);
        } catch (e) {
            const raw = (e as Error).message;
            let line: number | undefined;
            let col: number | undefined;
            const lineCol = raw.match(/line (\d+) column (\d+)/);
            if (lineCol) {
                line = Number(lineCol[1]);
                col = Number(lineCol[2]);
            } else {
                const pos = raw.match(/position (\d+)/);
                if (pos) {
                    const p = Math.min(Number(pos[1]), input.length);
                    const before = input.slice(0, p);
                    line = before.split('\n').length;
                    col = p - before.lastIndexOf('\n');
                }
            }
            setError({ kind: 'json', line, col, raw });
            setOutput('');
            setPreview(null);
            setRowCount(0);
            return;
        }

        const shaped = jsonToTable(parsed);
        if ('shapeError' in shaped) {
            setError({ kind: 'shape', code: shaped.shapeError });
            setOutput('');
            setPreview(null);
            setRowCount(0);
            return;
        }
        const { header, rows } = shaped.table;
        const allRows = header ? [header as unknown[], ...rows] : rows;
        setOutput(toCsv(allRows, delimiter));
        setPreview({
            header,
            rows: rows.slice(0, PREVIEW_ROWS).map((r) => r.map(cellToString)),
            total: rows.length,
        });
        setRowCount(rows.length);
        setError(null);
    }, [input, direction, delimiter, hasHeader, coerce]);

    // live convert, debounced
    useEffect(() => {
        const id = setTimeout(convert, 250);
        return () => clearTimeout(id);
    }, [convert]);

    const errorInfo = useMemo(() => {
        if (!error) return null;
        if (error.kind === 'csv') {
            const template = error.code === 'unclosed-quote' ? s.errUnclosed : s.errAfterQuote;
            return {
                headline: template.replace('{row}', String(error.row)).replace('{col}', String(error.col)),
            };
        }
        if (error.kind === 'json') {
            const headline =
                error.line !== undefined && error.col !== undefined
                    ? s.errJsonAt.replace('{row}', String(error.line)).replace('{col}', String(error.col))
                    : s.errJson;
            return { headline, detail: error.raw };
        }
        const map: Record<JsonShapeError, string> = {
            'not-array': s.errNotArray,
            'empty-array': s.errEmpty,
            'mixed-items': s.errMixed,
        };
        return { headline: map[error.code] };
    }, [error, s]);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (file.size > MAX_FILE_BYTES) {
            toast.error(s.fileTooBig);
            return;
        }
        try {
            const text = await file.text();
            setInput(text);
            toast.success(s.fileLoaded);
        } catch {
            toast.error(s.fileReadError);
        }
    };

    const copyOutput = async () => {
        if (!output) return;
        try {
            await navigator.clipboard.writeText(output);
            toast.success(s.copied);
        } catch {
            toast.error(s.copyFailed);
        }
    };

    const downloadOutput = () => {
        if (!output) return;
        const isJson = direction === 'csv2json';
        // BOM so Thai text opens correctly in Excel
        const blob = new Blob([isJson ? output : '\uFEFF' + output], {
            type: isJson ? 'application/json;charset=utf-8' : 'text/csv;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = isJson ? 'converted.json' : 'converted.csv';
        a.click();
        URL.revokeObjectURL(url);
        toast.success(s.downloaded);
    };

    const clearAll = () => {
        setInput('');
        setOutput('');
        setError(null);
        setPreview(null);
        setRowCount(0);
    };

    const dirOptions: { value: Direction; label: string }[] = [
        { value: 'csv2json', label: s.dirCsvJson },
        { value: 'json2csv', label: s.dirJsonCsv },
    ];
    const delimOptions: { value: Delim; label: string }[] = [
        { value: ',', label: s.delimComma },
        { value: ';', label: s.delimSemicolon },
        { value: '\t', label: s.delimTab },
    ];

    const isCsvInput = direction === 'csv2json';
    const InputIcon = isCsvInput ? FileSpreadsheet : FileJson;
    const OutputIcon = isCsvInput ? FileJson : FileSpreadsheet;

    const previewColCount = preview
        ? Math.max(preview.header?.length ?? 0, preview.rows.reduce((max, r) => Math.max(max, r.length), 0))
        : 0;
    const previewHeaders = preview
        ? preview.header ?? Array.from({ length: previewColCount }, (_, i) => String(i + 1))
        : [];

    return (
        <ToolShell
            icon={<Table className="w-6 h-6" strokeWidth={2.1} />}
            title={s.title}
            subtitle={s.subtitle}
            kicker={s.kicker}
            width="xwide"
            actions={<SegmentedControl options={dirOptions} value={direction} onChange={setDirection} />}
        >
            {/* options row */}
            <div className="mb-6 flex flex-wrap items-center gap-x-8 gap-y-4 px-5 py-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-line)]">
                <div className="flex items-center gap-3">
                    <span className="kicker text-[var(--color-ink-3)]">{s.delimiterLabel}</span>
                    <SegmentedControl options={delimOptions} value={delimiter} onChange={setDelimiter} />
                </div>
                <ToggleSwitch
                    checked={hasHeader}
                    onChange={setHasHeader}
                    label={s.headerToggle}
                    disabled={!isCsvInput}
                />
                <ToggleSwitch
                    checked={coerce}
                    onChange={setCoerce}
                    label={s.coerceToggle}
                    disabled={!isCsvInput}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:h-[540px]">
                {/* input pane */}
                <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="flex flex-col lg:h-full lg:min-h-0"
                >
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold tracking-[-0.01em] text-[var(--color-ink-2)]">
                            <InputIcon className="w-3.5 h-3.5 text-[var(--color-ink-3)]" />
                            {isCsvInput ? s.inputCsv : s.inputJson}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <GhostButton onClick={() => fileRef.current?.click()}>
                                <Upload className="w-3.5 h-3.5" />
                                {s.upload}
                            </GhostButton>
                            <GhostButton tone="danger" onClick={clearAll} disabled={!input && !output}>
                                <Trash2 className="w-3.5 h-3.5" />
                                {s.clear}
                            </GhostButton>
                        </span>
                    </div>
                    <input
                        ref={fileRef}
                        type="file"
                        accept={isCsvInput ? '.csv,.tsv,.txt,text/csv' : '.json,application/json'}
                        onChange={handleFile}
                        className="hidden"
                        aria-hidden="true"
                        tabIndex={-1}
                    />
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isCsvInput ? s.placeholderCsv : s.placeholderJson}
                        spellCheck={false}
                        wrap="off"
                        className="flex-grow h-[300px] lg:h-auto lg:min-h-0 w-full p-4 rounded-2xl border-[1.5px] border-[var(--color-line)] bg-white font-mono text-[13px] leading-relaxed text-[var(--color-ink-2)] placeholder:text-[var(--color-ink-4)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent-soft)] transition-all resize-none overflow-auto"
                    />
                </motion.div>

                {/* output pane */}
                <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
                    className="flex flex-col lg:h-full lg:min-h-0"
                >
                    <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                        <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold tracking-[-0.01em] text-[var(--color-ink-2)]">
                            <OutputIcon className="w-3.5 h-3.5 text-[var(--color-ink-3)]" />
                            {isCsvInput ? s.outputJson : s.outputCsv}
                            {error ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#fbf3f4] text-[11.5px] font-semibold text-[#a4364c]">
                                    <AlertCircle className="w-3 h-3" />
                                    {s.invalid}
                                </span>
                            ) : output ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#eef5f0] text-[11.5px] font-semibold text-[#3d6a4a]">
                                    <CheckCircle className="w-3 h-3" />
                                    {s.statusOk.replace('{n}', rowCount.toLocaleString())}
                                </span>
                            ) : null}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <GhostButton onClick={copyOutput} disabled={!output}>
                                <Copy className="w-3.5 h-3.5" />
                                {s.copy}
                            </GhostButton>
                            <GhostButton onClick={downloadOutput} disabled={!output}>
                                <Download className="w-3.5 h-3.5" />
                                {s.download}
                            </GhostButton>
                        </span>
                    </div>
                    <textarea
                        readOnly
                        value={output}
                        spellCheck={false}
                        wrap="off"
                        aria-label={isCsvInput ? s.outputJson : s.outputCsv}
                        className="flex-grow h-[300px] lg:h-auto lg:min-h-0 w-full p-4 rounded-2xl border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface-2)] font-mono text-[13px] leading-relaxed text-[var(--color-ink-2)] outline-none resize-none overflow-auto"
                    />
                </motion.div>
            </div>

            {/* inline error */}
            {errorInfo && (
                <div className="mt-5 flex items-start gap-3 p-4 rounded-2xl border border-[#e6b3bd] bg-[#fbf3f4]">
                    <AlertCircle className="w-4 h-4 text-[#a4364c] mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#a4364c]">{errorInfo.headline}</p>
                        {errorInfo.detail && (
                            <p className="mt-1 font-mono text-[12px] text-[#a4364c]/75 break-all">{errorInfo.detail}</p>
                        )}
                    </div>
                </div>
            )}

            {/* table preview */}
            {preview && preview.rows.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: EASE }}
                    className="mt-8"
                >
                    <div className="flex items-baseline justify-between gap-2 mb-3">
                        <span className="kicker text-[var(--color-ink-3)]">{s.previewTitle}</span>
                        <span className="text-[11.5px] text-[var(--color-ink-3)]">
                            {s.previewHint
                                .replace('{shown}', String(preview.rows.length))
                                .replace('{total}', preview.total.toLocaleString())}
                        </span>
                    </div>
                    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full font-mono text-[12.5px]">
                                <thead>
                                    <tr className="bg-[var(--color-surface-2)]">
                                        <th className="px-3.5 py-2.5 text-left font-semibold text-[var(--color-ink-4)] border-b border-[var(--color-line)] w-10">
                                            #
                                        </th>
                                        {previewHeaders.map((h, i) => (
                                            <th
                                                key={i}
                                                className="px-3.5 py-2.5 text-left font-semibold text-[var(--color-ink-2)] whitespace-nowrap border-b border-[var(--color-line)]"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.rows.map((row, ri) => (
                                        <tr key={ri} className={ri % 2 === 1 ? 'bg-[var(--color-base-tint)]' : ''}>
                                            <td className="px-3.5 py-2 text-[var(--color-ink-4)] border-b border-[var(--color-line)]">
                                                {ri + 1}
                                            </td>
                                            {Array.from({ length: previewColCount }, (_, ci) => (
                                                <td
                                                    key={ci}
                                                    className="px-3.5 py-2 text-[var(--color-ink-3)] whitespace-nowrap max-w-[260px] overflow-hidden text-ellipsis border-b border-[var(--color-line)]"
                                                >
                                                    {row[ci] ?? ''}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )}
        </ToolShell>
    );
}

/* ─── local toggle switch ─── */

function ToggleSwitch({
    checked, onChange, label, disabled = false,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className="inline-flex items-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
            <span
                className={`relative inline-flex w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-300 ${
                    checked ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-line-strong)]'
                }`}
            >
                <span
                    className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                        checked ? 'translate-x-4' : 'translate-x-0'
                    }`}
                />
            </span>
            <span className="text-[13px] font-medium tracking-[-0.01em] text-[var(--color-ink-2)]">{label}</span>
        </button>
    );
}
