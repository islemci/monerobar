"use client";

import { useState } from "react";

export function Footer() {
    const [openPopup, setOpenPopup] = useState<"about" | null>(null);
    const [popupTab, setPopupTab] = useState<"about" | "donate">("about");

    return (
        <>
            <div className="font-mono text-xs sm:text-sm tracking-widest">
                <div className="flex items-center justify-end gap-2 sm:gap-4">
                    <a
                        href="https://www.getmonero.org/"
                        rel="noopener noreferrer"
                        aria-label="Visit getmonero.org"
                        className="group inline-flex items-center"
                    >
                        <span
                            className="h-4 w-4 sm:h-5 sm:w-5 bg-zinc-200 transition-colors duration-200 group-hover:bg-accent-monero [mask-image:url('/monero.svg')] [mask-repeat:no-repeat] [mask-size:contain] [mask-position:center] [image-rendering:pixelated]"
                        />
                    </a>
                    <button
                        onClick={() => {
                            const nextPopup = openPopup === "about" ? null : "about";
                            setOpenPopup(nextPopup);
                            if (nextPopup) {
                                setPopupTab("about");
                            }
                        }}
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
                </div>
            </div>

            {openPopup === "about" && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="border border-white/20 rounded-none bg-black p-4 sm:p-6 max-w-sm w-full">
                        <div className="mb-3 flex border border-white/20">
                            <button
                                onClick={() => setPopupTab("about")}
                                className={`flex-1 px-3 py-1 text-xs sm:text-sm tracking-widest transition-colors ${popupTab === "about"
                                    ? "bg-white/10 text-accent-monero"
                                    : "text-zinc-400 hover:bg-white/5"
                                    }`}
                            >
                                ABOUT
                            </button>
                            <button
                                onClick={() => setPopupTab("donate")}
                                className={`flex-1 border-l border-white/20 px-3 py-1 text-xs sm:text-sm tracking-widest transition-colors ${popupTab === "donate"
                                    ? "bg-white/10 text-accent-monero"
                                    : "text-zinc-400 hover:bg-white/5"
                                    }`}
                            >
                                DONATE
                            </button>
                        </div>

                        {popupTab === "about" ? (
                            <>
                                <h3 className="text-accent-monero tracking-widest font-mono mb-2 text-xs sm:text-sm">
                                    ABOUT MONERO.BAR
                                </h3>
                                <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-4">
                                    Monero.bar is a real-time network dashboard for Monero, displaying live blockchain statistics, mining pool distribution, and node health metrics. Built to provide transparency into the Monero network's operational status.
                                </p>
                            </>
                        ) : (
                            <>
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
                            </>
                        )}

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
