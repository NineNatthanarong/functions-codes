'use client';

import { motion } from 'framer-motion';
import { Heart, Coffee, Shield } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="border-t border-stone-200 bg-gradient-to-b from-white to-stone-50/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col items-center gap-8">
                    {/* Main footer content */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 w-full">
                        <div className="flex flex-col items-center md:items-start gap-2">
                            <p className="text-sm text-stone-600">
                                © {new Date().getFullYear()} functions.codes
                            </p>
                            <p className="text-xs text-stone-500 max-w-xs text-center md:text-left flex items-center gap-1">
                                Made with
                                <motion.span
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                    className="inline-block"
                                >
                                    <Heart className="w-3 h-3 inline text-red-400 fill-red-400" />
                                </motion.span>
                                and questionable amounts of
                                <motion.span
                                    animate={{ rotate: [-5, 5, -5] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="inline-block"
                                >
                                    <Coffee className="w-3 h-3 inline text-amber-600" />
                                </motion.span>
                            </p>
                        </div>

                        <div className="flex gap-6">
                            <motion.a
                                href="https://www.linkedin.com/in/natthanarong-tiangjit/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-stone-600 hover:text-blue-600 transition-colors font-medium relative group"
                                whileHover={{ y: -2 }}
                            >
                                LinkedIn
                                <span className="absolute bottom-0 left-1/2 w-0 h-[1.5px] bg-blue-600 transition-all duration-300 group-hover:w-full group-hover:left-0" />
                            </motion.a>
                        </div>
                    </div>

                    {/* Fun privacy section */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-[1.5px] border-purple-200/50 rounded-tl-3xl rounded-tr-2xl rounded-bl-2xl rounded-br-3xl p-6 max-w-3xl w-full shadow-[0_4px_20px_-6px_rgb(168,85,247,0.12)]"
                    >
                        <div className="flex items-start gap-3 mb-3">
                            <motion.div
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            </motion.div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Your Data (or lack thereof) 🎪</h3>
                                <p className="text-sm text-gray-600 leading-relaxed mb-3">
                                    Everything happens in <strong>your browser</strong>. No servers. No databases.
                                    No user accounts. No cookies (except the ones you&apos;re eating).
                                    No analytics. No tracking pixels. No sneaky scripts.
                                </p>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Why? Not because I&apos;m a privacy hero, but because <strong>I literally can&apos;t afford a server</strong>.
                                    Your privacy is protected by my empty wallet. Win-win! 💸✨
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-purple-200/50">
                            <p className="text-xs text-gray-500 text-center">
                                <strong>Why this exists:</strong> Got tired of clicking through 47 ads just to resize an image.
                                So I built this. You&apos;re welcome. 🚀
                            </p>
                        </div>
                    </motion.div>

                    {/* Playful disclaimer */}
                    <p className="text-xs text-stone-400 text-center max-w-2xl italic">
                        All tools are free and always will be (because I still can&apos;t afford a payment processor either 😂)
                    </p>
                </div>
            </div>
        </footer>
    );
}
