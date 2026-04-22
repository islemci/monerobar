import Link from "next/link";
import { ExplorerDashboard } from "@/components/explorer-dashboard";
import { TuiContainer } from "@/components/tui/tui-container";
import { Footer } from "@/components/footer";
import { getExplorerData } from "@/actions/get-explorer-data";
import type { ExplorerData } from "@/types/explorer";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "monero.bar | Blockchain Explorer",
  description:
    "Browse the latest Monero blocks with height, difficulty, reward, transaction count, and more.",
};

async function getInitialData(): Promise<ExplorerData | undefined> {
  try {
    return await getExplorerData();
  } catch {
    return undefined;
  }
}

export default async function ExplorerPage() {
  const initialData = await getInitialData();

  return (
    <main className="min-h-screen bg-background px-3 py-3 text-primary sm:px-6 sm:py-4">
      <TuiContainer>
        <div className="mb-2 sm:mb-4 flex flex-col gap-2 border border-white/10 rounded-none p-2 sm:p-3 sm:flex-row sm:items-start sm:justify-between">
          <header className="font-mono text-xs sm:text-sm tracking-widest text-white text-left">
            <Link
              href="/"
              className="hover:opacity-80"
            >
              <span className="bg-gradient-to-r from-accent-monero via-amber-300 to-[#fff1cc] bg-clip-text text-transparent">
                [ MONERO.BAR ]
              </span>
            </Link>
            <span className="text-zinc-400 ml-2">/ EXPLORER</span>
          </header>
          <Footer />
        </div>

        <ExplorerDashboard initialData={initialData} />
      </TuiContainer>
    </main>
  );
}
