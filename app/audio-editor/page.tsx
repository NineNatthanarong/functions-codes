'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Play, Pause, Scissors, Trash2, Music, Mic } from 'lucide-react';
import { toast } from 'sonner';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';
import { useT } from '@/lib/i18n/LanguageProvider';
import ToolShell, { ToolCard, PrimaryButton, SecondaryButton } from '@/components/ToolShell';

export default function AudioEditor() {
    const t = useT();
    const tt = t.pages.audio;
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [hasRegion, setHasRegion] = useState(false);

    const waveformRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionsPluginRef = useRef<ReturnType<typeof RegionsPlugin.create> | null>(null);

    useEffect(() => {
        if (!waveformRef.current) return;

        const wavesurfer = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#c98a98',
            progressColor: '#552834',
            cursorColor: '#3f1d27',
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

        regions.on('region-created', () => setHasRegion(true));
        regions.on('region-removed', () => {
            if (regions.getRegions().length === 0) setHasRegion(false);
        });

        wavesurferRef.current = wavesurfer;
        return () => { wavesurfer.destroy(); };
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('audio/')) { toast.error(t.common.pleaseSelectAudio); return; }

        setAudioFile(file);
        setIsLoading(true);
        setHasRegion(false);

        if (wavesurferRef.current) {
            const url = URL.createObjectURL(file);
            await wavesurferRef.current.load(url);
            toast.success(tt.loadedToast);
        }
    };

    const togglePlay = () => wavesurferRef.current?.playPause();

    const addRegion = () => {
        if (!wavesurferRef.current || !regionsPluginRef.current) return;
        regionsPluginRef.current.clearRegions();
        const dur = wavesurferRef.current.getDuration();
        regionsPluginRef.current.addRegion({
            start: dur * 0.33,
            end: dur * 0.66,
            color: 'rgba(85, 40, 52, 0.22)',
            drag: true,
            resize: true,
        });
        toast.success(tt.addedToast);
    };

    const trimAudio = async () => {
        if (!wavesurferRef.current || !regionsPluginRef.current || !audioFile) {
            toast.error(tt.addFirstToast); return;
        }
        const regions = regionsPluginRef.current.getRegions();
        if (regions.length === 0) { toast.error(tt.addFirstToast); return; }

        const region = regions[0];
        toast.info(tt.trimmingToast);

        try {
            const buf = await audioFile.arrayBuffer();
            const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            const audioBuffer = await ctx.decodeAudioData(buf);
            const sr = audioBuffer.sampleRate;
            const startSample = Math.floor(region.start * sr);
            const endSample = Math.floor(region.end * sr);
            const newLength = endSample - startSample;
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
            link.download = 'trimmed.wav';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success(tt.trimSuccessToast);
        } catch (err) {
            console.error(err);
            toast.error(tt.trimFailToast);
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
        setAudioFile(null);
        setHasRegion(false);
        setCurrentTime(0);
        setDuration(0);
        wavesurferRef.current?.empty();
        regionsPluginRef.current?.clearRegions();
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
                        className="border-2 border-dashed border-[var(--color-wine-200)] rounded-2xl p-12 text-center cursor-pointer hover:border-[var(--color-wine-400)] hover:bg-[var(--color-wine-50)] transition-all"
                        onClick={() => document.getElementById('audio-upload')?.click()}
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
                                className="w-16 h-16 bg-[var(--color-wine-700)] text-[var(--color-cream)] rounded-full hover:bg-[var(--color-wine-600)] disabled:opacity-50 transition-colors flex items-center justify-center shadow-lift"
                            >
                                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                            </motion.button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <SecondaryButton onClick={addRegion} disabled={isLoading} className="py-3">
                                <Scissors className="w-4 h-4" />
                                {tt.addRegion}
                            </SecondaryButton>
                            <PrimaryButton onClick={trimAudio} disabled={isLoading || !hasRegion} className="py-3">
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
