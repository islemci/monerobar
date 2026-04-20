import { MoneroDashboard } from "@/components/monero-dashboard";
import { TuiContainer } from "@/components/tui/tui-container";
import { Footer } from "@/components/footer";
import { getNetworkStats } from "@/actions/get-network-stats";
import type { MoneroStats } from "@/types/monero";

export const dynamic = "force-dynamic";

async function getInitialData(): Promise<MoneroStats | undefined> {
  try {
    return await getNetworkStats();
  } catch {
    return undefined;
  }
}

export default async function Home() {
  const initialData = await getInitialData();

  return (
    <main className="min-h-screen bg-background px-3 py-3 text-primary sm:px-6 sm:py-4">
      <TuiContainer>
        <header className="mb-2 sm:mb-4 border border-white/10 rounded-none p-2 sm:p-3 text-center font-mono text-xs sm:text-sm tracking-widest text-white">
          [ MONERO.BAR : NETWORK DASHBOARD ]
        </header>

        <MoneroDashboard initialData={initialData} />

        <Footer />
      </TuiContainer>
    </main>
  );
}
