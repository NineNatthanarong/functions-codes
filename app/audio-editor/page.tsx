'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Play, Pause, Scissors, Volume2, Trash2, Music } from 'lucide-react';
import { toast } from 'sonner';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';

export default function AudioEditor() {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [hasRegion, setHasRegion] = useState(false);

    const waveformRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionsPluginRef = useRef<any>(null);

    useEffect(() => {
        if (!waveformRef.current) return;

        // Initialize WaveSurfer
        const wavesurfer = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#fbbf24',
            progressColor: '#f59e0b',
            cursorColor: '#ea580c',
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 120,
            normalize: true,
            backend: 'WebAudio',
        });

        // Initialize Regions Plugin
        const regions = wavesurfer.registerPlugin(RegionsPlugin.create());
        regionsPluginRef.current = regions;

        wavesurfer.on('ready', () => {
            setDuration(wavesurfer.getDuration());
            setIsLoading(false);
        });

        wavesurfer.on('play', () => setIsPlaying(true));
        wavesurfer.on('pause', () => setIsPlaying(false));
        wavesurfer.on('finish', () => setIsPlaying(false));
        wavesurfer.on('timeupdate', (time) => setCurrentTime(time));

        regions.on('region-created', () => setHasRegion(true));
        regions.on('region-removed', () => {
            if (regions.getRegions().length === 0) {
                setHasRegion(false);
            }
        });

        wavesurferRef.current = wavesurfer;

        return () => {
            wavesurfer.destroy();
        };
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('audio/')) {
            toast.error('Please select a valid audio file');
            return;
        }

        setAudioFile(file);
        setIsLoading(true);
        setHasRegion(false);

        if (wavesurferRef.current) {
            const url = URL.createObjectURL(file);
            await wavesurferRef.current.load(url);
            toast.success('Audio loaded successfully!');
        }
    };

    const togglePlayPause = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
        }
    };

    const addRegion = () => {
        if (!wavesurferRef.current || !regionsPluginRef.current) return;

        // Clear existing regions
        regionsPluginRef.current.clearRegions();

        // Add new region in the middle third of the audio
        const duration = wavesurferRef.current.getDuration();
        const start = duration * 0.33;
        const end = duration * 0.66;

        regionsPluginRef.current.addRegion({
            start,
            end,
            color: 'rgba(251, 191, 36, 0.3)',
            drag: true,
            resize: true,
        });

        toast.success('Selection added! Drag edges to adjust');
    };

    const trimAudio = async () => {
        if (!wavesurferRef.current || !regionsPluginRef.current || !audioFile) {
            toast.error('Please select a region to trim');
            return;
        }

        const regions = regionsPluginRef.current.getRegions();
        if (regions.length === 0) {
            toast.error('Please add a selection first');
            return;
        }

        const region = regions[0];
        const start = region.start;
        const end = region.end;

        toast.info('Trimming audio...');

        try {
            const arrayBuffer = await audioFile.arrayBuffer();
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            const sampleRate = audioBuffer.sampleRate;
            const startSample = Math.floor(start * sampleRate);
            const endSample = Math.floor(end * sampleRate);
            const newLength = endSample - startSample;

            const trimmedBuffer = audioContext.createBuffer(
                audioBuffer.numberOfChannels,
                newLength,
                sampleRate
            );

            for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                const oldData = audioBuffer.getChannelData(channel);
                const newData = trimmedBuffer.getChannelData(channel);
                for (let i = 0; i < newLength; i++) {
                    newData[i] = oldData[startSample + i];
                }
            }

            // Convert to WAV
            const wav = audioBufferToWav(trimmedBuffer);
            const blob = new Blob([wav], { type: 'audio/wav' });
            downloadAudio(blob, 'trimmed.wav');

            toast.success('Audio trimmed successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to trim audio');
        }
    };

    const downloadAudio = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Helper function to convert AudioBuffer to WAV
    const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
        const length = buffer.length * buffer.numberOfChannels * 2 + 44;
        const arrayBuffer = new ArrayBuffer(length);
        const view = new DataView(arrayBuffer);
        const channels: Float32Array[] = [];
        let offset = 0;
        let pos = 0;

        // Write WAV header
        const setUint16 = (data: number) => {
            view.setUint16(pos, data, true);
            pos += 2;
        };
        const setUint32 = (data: number) => {
            view.setUint32(pos, data, true);
            pos += 4;
        };

        setUint32(0x46464952); // "RIFF"
        setUint32(length - 8); // file length - 8
        setUint32(0x45564157); // "WAVE"
        setUint32(0x20746d66); // "fmt " chunk
        setUint32(16); // length = 16
        setUint16(1); // PCM (uncompressed)
        setUint16(buffer.numberOfChannels);
        setUint32(buffer.sampleRate);
        setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels); // avg. bytes/sec
        setUint16(buffer.numberOfChannels * 2); // block-align
        setUint16(16); // 16-bit
        setUint32(0x61746164); // "data" - chunk
        setUint32(length - pos - 4); // chunk length

        // Write interleaved data
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            channels.push(buffer.getChannelData(i));
        }

        while (pos < length) {
            for (let i = 0; i < buffer.numberOfChannels; i++) {
                let sample = Math.max(-1, Math.min(1, channels[i][offset]));
                sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
                view.setInt16(pos, sample, true);
                pos += 2;
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
        if (wavesurferRef.current) {
            wavesurferRef.current.empty();
        }
        if (regionsPluginRef.current) {
            regionsPluginRef.current.clearRegions();
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] py-12 sm:py-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
                    >
                        Audio Editor
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-500 text-lg max-w-2xl mx-auto"
                    >
                        Edit audio with beautiful waveform visualization. Trim, select, and export.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100"
                >
                    {/* Upload Area */}
                    {!audioFile && (
                        <div
                            className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-all"
                            onClick={() => document.getElementById('audio-upload')?.click()}
                        >
                            <input
                                id="audio-upload"
                                type="file"
                                accept="audio/*"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 mx-auto text-amber-500">
                                <Upload className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Audio File</h3>
                            <p className="text-gray-500">Click to browse or drag audio file here</p>
                            <p className="text-sm text-gray-400 mt-2">Supports MP3, WAV, OGG, M4A</p>
                        </div>
                    )}

                    {/* Waveform & Controls */}
                    {audioFile && (
                        <div className="space-y-6">
                            {/* File Info */}
                            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Music className="w-6 h-6 text-amber-600" />
                                    <div>
                                        <p className="font-medium text-gray-900">{audioFile.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {formatTime(duration)} · {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={clearAudio}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Waveform */}
                            <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl p-6 border border-amber-100">
                                {isLoading && (
                                    <div className="flex items-center justify-center h-32">
                                        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                                <div ref={waveformRef} className={isLoading ? 'hidden' : ''} />

                                {/* Timeline */}
                                <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            {/* Playback Controls */}
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={togglePlayPause}
                                    disabled={isLoading}
                                    className="w-16 h-16 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 transition-all flex items-center justify-center shadow-lg shadow-amber-200"
                                >
                                    {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                                </button>
                            </div>

                            {/* Editing Controls */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={addRegion}
                                    disabled={isLoading}
                                    className="py-3 px-6 bg-amber-100 text-amber-700 font-medium rounded-xl hover:bg-amber-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <Scissors className="w-5 h-5" />
                                    Add Selection
                                </button>
                                <button
                                    onClick={trimAudio}
                                    disabled={isLoading || !hasRegion}
                                    className="py-3 px-6 bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-medium rounded-xl hover:from-amber-700 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-200"
                                >
                                    <Download className="w-5 h-5" />
                                    Trim & Download
                                </button>
                            </div>

                            {/* Instructions */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <p className="text-sm text-blue-800">
                                    <strong>How to use:</strong> Click "Add Selection" to create a region, then drag the edges to adjust the trim area. Click "Trim & Download" to save the selected portion.
                                </p>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
