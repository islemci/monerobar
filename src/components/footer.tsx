"use client";

import { useState } from "react";

export function Footer() {
    const [openPopup, setOpenPopup] = useState<"about" | "donate" | null>(null);

    return (
        <>
            <footer className="mt-3 sm:mt-4 border border-white/10 rounded-none p-2 sm:p-3 text-center font-mono text-xs sm:text-sm tracking-widest">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                    <button
                        onClick={() => setOpenPopup(openPopup === "about" ? null : "about")}
                        className="text-white hover:text-accent-monero transition-colors cursor-pointer"
                    >
                        [ ABOUT ]
                    </button>
                    <a
                        href="https://github.com/islemci/monerobar"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-accent-monero transition-colors"
                    >
                        [ GITHUB ]
                    </a>
                    <button
                        onClick={() => setOpenPopup(openPopup === "donate" ? null : "donate")}
                        className="text-white hover:text-accent-monero transition-colors cursor-pointer"
                    >
                        [ DONATE ]
                    </button>
                </div>
            </footer>

            {openPopup === "about" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="border border-white/20 rounded-none bg-black p-4 sm:p-6 max-w-sm w-full">
                        <h3 className="text-accent-monero tracking-widest font-mono mb-2 text-xs sm:text-sm">
                            ABOUT MONERO.BAR
                        </h3>
                        <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-4">
                            Monero.bar is a real-time network dashboard for Monero, displaying live blockchain statistics, mining pool distribution, and node health metrics. Built to provide transparency into the Monero network's operational status.
                        </p>
                        <button
                            onClick={() => setOpenPopup(null)}
                            className="w-full px-3 py-1 border border-white/20 hover:bg-white/10 transition-colors text-xs sm:text-sm tracking-widest"
                        >
                            CLOSE
                        </button>
                    </div>
                </div>
            )}

            {openPopup === "donate" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="border border-white/20 rounded-none bg-black p-4 sm:p-6 max-w-sm w-full">
                        <h3 className="text-accent-monero tracking-widest font-mono mb-2 text-xs sm:text-sm">
                            SUPPORT MONERO.BAR
                        </h3>
                        <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-3">
                            Help me keep monero.bar running by donating XMR. Your support goes towards server costs and future improvements. Thank you for your generosity!
                        </p>
                        <div className="bg-white/5 border border-white/10 p-2 mb-4 rounded-none">
                            <p className="text-accent-monero text-xs font-mono break-all">
                                8AW8DB59Cb5CGe9421RVwWPcmGEEkWt5uTC7XQWxxgnUWaFTFV5hA5uFoNd26gybPcCckxrtzt4hf6Y5w9bn47Pw2NfeiJG
                            </p>
                        </div>
                        <button
                            onClick={() => setOpenPopup(null)}
                            className="w-full px-3 py-1 border border-white/20 hover:bg-white/10 transition-colors text-xs sm:text-sm tracking-widest"
                        >
                            CLOSE
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
