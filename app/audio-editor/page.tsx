'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Play, Pause, Scissors, Trash2, Music, Mic } from 'lucide-react';
import { toast } from 'sonner';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';
import { useT, useLanguage } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, PrimaryButton, SecondaryButton } from '@/components/ToolShell';

const AUDIO_EXTENSIONS = /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|weba)$/i;

export default function AudioEditor() {
    const t = useT();
    const tt = t.pages.audio;
    const { locale } = useLanguage();
    const s = locale === 'th' ? {
        loadError: 'ไม่สามารถโหลดไฟล์เสียงนี้ได้',
        play: 'เล่น',
        pause: 'หยุดชั่วคราว',
        removeFile: 'ลบไฟล์',
        playSelection: 'เล่นช่วงที่เลือก',
        selection: 'ช่วงที่เลือก',
    } : {
        loadError: 'Could not load this audio file',
        play: 'Play',
        pause: 'Pause',
        removeFile: 'Remove file',
        playSelection: 'Play selection',
        selection: 'Selection',
    };
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isTrimming, setIsTrimming] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [hasRegion, setHasRegion] = useState(false);
    const [regionBounds, setRegionBounds] = useState<{ start: number; end: number } | null>(null);

    const waveformRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionsPluginRef = useRef<ReturnType<typeof RegionsPlugin.create> | null>(null);
    const objectUrlRef = useRef<string | null>(null);
    const loadIdRef = useRef(0);

    useEffect(() => {
        if (!waveformRef.current) return;

        const rootStyles = getComputedStyle(document.documentElement);
        const themeColor = (name: string, fallback: string) =>
            rootStyles.getPropertyValue(name).trim() || fallback;

        const wavesurfer = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: themeColor('--color-wine-300', '#9ca3af'),
            progressColor: themeColor('--color-wine-700', '#14213d'),
            cursorColor: themeColor('--color-wine-800', '#000000'),
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 120,
            normalize: true,
            backend: 'WebAudio',
        });

        const regions = wavesurfer.registerPlugin(RegionsPlugin.create());
        regionsPluginRef.current = regions;

        wavesurfer.on('ready', () => { setDuration(wavesurfer.getDuration()); setIsLoading(false); });
        wavesurfer.on('play', () => setIsPlaying(true));
        wavesurfer.on('pause', () => setIsPlaying(false));
        wavesurfer.on('finish', () => setIsPlaying(false));
        wavesurfer.on('timeupdate', (time) => setCurrentTime(time));

        regions.on('region-created', (region) => {
            setHasRegion(true);
            setRegionBounds({ start: region.start, end: region.end });
        });
        regions.on('region-update', (region) => setRegionBounds({ start: region.start, end: region.end }));
        regions.on('region-updated', (region) => setRegionBounds({ start: region.start, end: region.end }));
        regions.on('region-removed', () => {
            if (regions.getRegions().length === 0) { setHasRegion(false); setRegionBounds(null); }
        });

        wavesurferRef.current = wavesurfer;
        return () => {
            wavesurfer.destroy();
            if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null; }
        };
    }, []);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            if (target && (
                target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' || target.tagName === 'BUTTON' ||
                target.isContentEditable
            )) return;
            if (!audioFile || isLoading) return;
            if (e.code === 'Space') {
                e.preventDefault();
                wavesurferRef.current?.playPause();
            } else if ((e.key === 'Delete' || e.key === 'Backspace') && regionsPluginRef.current) {
                if (regionsPluginRef.current.getRegions().length > 0) {
                    e.preventDefault();
                    regionsPluginRef.current.clearRegions();
                }
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [audioFile, isLoading]);

    const loadFile = async (file: File) => {
        if (!file.type.startsWith('audio/') && !AUDIO_EXTENSIONS.test(file.name)) {
            toast.error(t.common.pleaseSelectAudio);
            return;
        }
        const wavesurfer = wavesurferRef.current;
        if (!wavesurfer) return;

        const loadId = ++loadIdRef.current;
        setAudioFile(file);
        setIsLoading(true);
        setHasRegion(false);
        setRegionBounds(null);
        setCurrentTime(0);
        regionsPluginRef.current?.clearRegions();

        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        const url = URL.createObjectURL(file);
        objectUrlRef.current = url;

        try {
            await wavesurfer.load(url);
            if (loadIdRef.current !== loadId) return;
            toast.success(tt.loadedToast);
        } catch (err) {
            if (loadIdRef.current !== loadId) return;
            console.error(err);
            if (objectUrlRef.current === url) { URL.revokeObjectURL(url); objectUrlRef.current = null; }
            setAudioFile(null);
            toast.error(s.loadError);
        } finally {
            if (loadIdRef.current === loadId) setIsLoading(false);
        }
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (file) loadFile(file);
    };

    const togglePlay = () => wavesurferRef.current?.playPause();

    const addRegion = () => {
        if (!wavesurferRef.current || !regionsPluginRef.current) return;
        const dur = wavesurferRef.current.getDuration();
        if (!dur) return;
        regionsPluginRef.current.clearRegions();
        const span = dur / 3;
        const start = Math.max(0, Math.min(wavesurferRef.current.getCurrentTime() - span / 2, dur - span));
        regionsPluginRef.current.addRegion({
            start,
            end: start + span,
            color: 'color-mix(in srgb, var(--color-wine-700) 22%, transparent)',
            drag: true,
            resize: true,
        });
        toast.success(tt.addedToast);
    };

    const playSelection = () => {
        regionsPluginRef.current?.getRegions()[0]?.play(true);
    };

    const trimAudio = async () => {
        if (!wavesurferRef.current || !regionsPluginRef.current || !audioFile) {
            toast.error(tt.addFirstToast); return;
        }
        const regions = regionsPluginRef.current.getRegions();
        if (regions.length === 0) { toast.error(tt.addFirstToast); return; }

        const region = regions[0];
        setIsTrimming(true);
        toast.info(tt.trimmingToast);

        let ctx: AudioContext | null = null;
        try {
            const buf = await audioFile.arrayBuffer();
            ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            const audioBuffer = await ctx.decodeAudioData(buf);
            const sr = audioBuffer.sampleRate;
            const startSample = Math.max(0, Math.min(Math.floor(region.start * sr), audioBuffer.length));
            const endSample = Math.max(startSample, Math.min(Math.floor(region.end * sr), audioBuffer.length));
            const newLength = endSample - startSample;
            if (newLength <= 0) { toast.error(tt.trimFailToast); return; }
            const trimmed = ctx.createBuffer(audioBuffer.numberOfChannels, newLength, sr);

            for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
                const oldData = audioBuffer.getChannelData(ch);
                const newData = trimmed.getChannelData(ch);
                for (let i = 0; i < newLength; i++) newData[i] = oldData[startSample + i];
            }

            const wav = audioBufferToWav(trimmed);
            const blob = new Blob([wav], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${audioFile.name.replace(/\.[^.]+$/, '')}-trimmed.wav`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success(tt.trimSuccessToast);
        } catch (err) {
            console.error(err);
            toast.error(tt.trimFailToast);
        } finally {
            setIsTrimming(false);
            if (ctx) ctx.close().catch(() => {});
        }
    };

    const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
        const length = buffer.length * buffer.numberOfChannels * 2 + 44;
        const arrayBuffer = new ArrayBuffer(length);
        const view = new DataView(arrayBuffer);
        const channels: Float32Array[] = [];
        let offset = 0, pos = 0;

        const setUint16 = (d: number) => { view.setUint16(pos, d, true); pos += 2; };
        const setUint32 = (d: number) => { view.setUint32(pos, d, true); pos += 4; };

        setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157);
        setUint32(0x20746d66); setUint32(16); setUint16(1);
        setUint16(buffer.numberOfChannels); setUint32(buffer.sampleRate);
        setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels);
        setUint16(buffer.numberOfChannels * 2); setUint16(16);
        setUint32(0x61746164); setUint32(length - pos - 4);

        for (let i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));

        while (pos < length) {
            for (let i = 0; i < buffer.numberOfChannels; i++) {
                let s = Math.max(-1, Math.min(1, channels[i][offset]));
                s = s < 0 ? s * 0x8000 : s * 0x7fff;
                view.setInt16(pos, s, true); pos += 2;
            }
            offset++;
        }
        return arrayBuffer;
    };

    const clearAudio = () => {
        loadIdRef.current++;
        setAudioFile(null);
        setHasRegion(false);
        setRegionBounds(null);
        setCurrentTime(0);
        setDuration(0);
        setIsLoading(false);
        wavesurferRef.current?.empty();
        regionsPluginRef.current?.clearRegions();
        if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null; }
    };

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <ToolShell
            icon={<Mic className="w-6 h-6" strokeWidth={2.1} />}
            title={tt.title}
            subtitle={tt.subtitle}
            kicker="Audio"
            width="wide"
        >
            <ToolCard>
                {!audioFile && (
                    <div
                        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer hover:border-[var(--color-wine-400)] hover:bg-[var(--color-wine-50)] transition-all ${isDragOver ? 'border-[var(--color-wine-400)] bg-[var(--color-wine-50)]' : 'border-[var(--color-wine-200)]'}`}
                        onClick={() => document.getElementById('audio-upload')?.click()}
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragOver(false);
                            const file = e.dataTransfer.files?.[0];
                            if (file) loadFile(file);
                        }}
                    >
                        <input id="audio-upload" type="file" accept="audio/*" className="hidden" onChange={handleUpload} />
                        <motion.div
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-20 h-20 bg-[var(--color-wine-100)] rounded-2xl flex items-center justify-center mb-5 mx-auto text-[var(--color-wine-700)]"
                        >
                            <Upload className="w-8 h-8" />
                        </motion.div>
                        <h3 className="text-lg font-semibold text-[var(--color-wine-700)] mb-1.5">{tt.uploadTitle}</h3>
                        <p className="text-[var(--color-smoke-600)] text-sm">{tt.uploadHint}</p>
                        <p className="text-[12px] text-[var(--color-smoke-600)]/80 mt-2">{tt.formats}</p>
                    </div>
                )}

                {audioFile && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-[var(--color-wine-50)] rounded-2xl border border-[var(--color-wine-100)]">
                            <div className="flex items-center gap-3">
                                <Music className="w-5 h-5 text-[var(--color-wine-700)]" />
                                <div>
                                    <p className="font-semibold text-[var(--color-wine-700)] truncate max-w-[260px]">{audioFile.name}</p>
                                    <p className="text-[12px] text-[var(--color-smoke-600)]">
                                        {formatTime(duration)} · {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={clearAudio}
                                aria-label={s.removeFile}
                                title={s.removeFile}
                                className="p-2 text-[#a4364c] hover:bg-[#fbe3e7] rounded-xl transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="bg-[var(--color-wine-50)] rounded-2xl p-6 border border-[var(--color-wine-100)]">
                            {isLoading && (
                                <div className="flex items-center justify-center h-32">
                                    <div className="w-7 h-7 border-4 border-[var(--color-wine-700)] border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                            <div ref={waveformRef} className={isLoading ? 'hidden' : ''} />
                            <div className="flex items-center justify-between mt-4 text-[12.5px] text-[var(--color-smoke-600)]">
                                <span className="font-mono">{formatTime(currentTime)}</span>
                                <span className="font-mono">{formatTime(duration)}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-center">
                            <motion.button
                                whileTap={{ scale: 0.92 }}
                                whileHover={{ scale: 1.04 }}
                                onClick={togglePlay}
                                disabled={isLoading}
                                aria-label={isPlaying ? s.pause : s.play}
                                className="w-16 h-16 bg-[var(--color-wine-700)] text-[var(--color-cream)] rounded-full hover:bg-[var(--color-wine-600)] disabled:opacity-50 transition-colors flex items-center justify-center shadow-lift"
                            >
                                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                            </motion.button>
                        </div>

                        {regionBounds && (
                            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                                <span className="font-mono text-[12.5px] text-[var(--color-smoke-600)]">
                                    {s.selection}: {formatTime(regionBounds.start)} – {formatTime(regionBounds.end)}
                                </span>
                                <button
                                    onClick={playSelection}
                                    disabled={isLoading}
                                    className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--color-wine-700)] hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <Play className="w-3.5 h-3.5" />
                                    {s.playSelection}
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <SecondaryButton onClick={addRegion} disabled={isLoading} className="py-3">
                                <Scissors className="w-4 h-4" />
                                {tt.addRegion}
                            </SecondaryButton>
                            <PrimaryButton onClick={trimAudio} disabled={isLoading || !hasRegion || isTrimming} className="py-3">
                                <Download className="w-4 h-4" />
                                {tt.trimDownload}
                            </PrimaryButton>
                        </div>

                        <div className="bg-[var(--color-wine-50)] border border-[var(--color-wine-100)] rounded-2xl p-4 flex items-start gap-3">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-wine-700)] text-[var(--color-cream)] text-[11px] font-bold tracking-wider shrink-0">
                                ?
                            </span>
                            <div className="text-[13px] text-[var(--color-smoke-600)]">
                                <p className="font-semibold text-[var(--color-wine-700)] mb-1">{tt.howTitle}</p>
                                <p className="leading-relaxed">{tt.howBody}</p>
                            </div>
                        </div>
                    </div>
                )}
            </ToolCard>
        </ToolShell>
    );
}
