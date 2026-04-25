import type { Metadata } from "next";
import Link from "next/link";
import { getBlockDetail } from "@/actions/get-block-detail";
import { BlockDetailDashboard } from "@/components/block-detail-dashboard";
import { Footer } from "@/components/footer";
import { TuiContainer } from "@/components/tui/tui-container";

export const dynamic = "force-dynamic";

type BlockDetailPageProps = {
  params: Promise<{
    blockId: string;
  }>;
};

function formatNavbarBlockId(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length <= 8) {
    return trimmed;
  }

  return trimmed.slice(0, 8);
}

export async function generateMetadata({
  params,
}: BlockDetailPageProps): Promise<Metadata> {
  const { blockId } = await params;
  const block = await getBlockDetail(blockId);

  if (!block) {
    return {
      title: "monero.bar | Block Not Found",
      description: "Requested Monero block detail could not be found.",
    };
  }

  return {
    title: `monero.bar | Block ${block.height.toLocaleString()}`,
    description: `Monero block ${block.height.toLocaleString()} with reward, solver, previous block id, timestamp, and included transactions.`,
  };
}

export default async function BlockDetailPage({
  params,
}: BlockDetailPageProps) {
  const { blockId } = await params;
  const block = await getBlockDetail(blockId);
  const navbarBlockId = formatNavbarBlockId(block?.hash ?? blockId);

  return (
    <main className="min-h-screen bg-background px-3 py-3 text-primary sm:px-6 sm:py-4">
      <TuiContainer>
        <div className="mb-2 sm:mb-4 flex flex-col gap-2 border border-white/10 rounded-none p-2 sm:p-3 sm:flex-row sm:items-start sm:justify-between">
          <header className="font-mono text-xs sm:text-sm tracking-widest text-white text-left">
            <Link href="/" className="hover:opacity-80">
              <span className="bg-gradient-to-r from-accent-monero via-amber-300 to-[#fff1cc] bg-clip-text text-transparent">
                [ MONERO.BAR ]
              </span>
            </Link>
            <span className="text-zinc-400 ml-2">/</span>
            <Link
              href="/blocks"
              className="text-zinc-400 ml-2 hover:text-accent-monero transition-colors"
            >
                BLOCKS
            </Link>
            <span className="text-zinc-600 ml-2">/ {navbarBlockId}</span>
          </header>
          <Footer />
        </div>

        {block ? (
          <BlockDetailDashboard block={block} />
        ) : (
          <section className="border border-white/10 rounded-none p-4 font-mono text-xs tracking-tighter text-white sm:text-sm">
            <p className="text-status-offline">[!] BLOCK NOT FOUND</p>
            <p className="mt-2 text-zinc-400">
              The requested block is not available in the current explorer
              cache.
            </p>
            <Link
              href="/blocks"
              className="mt-4 inline-block border border-white/10 px-3 py-2 text-zinc-300 hover:border-accent-monero hover:text-accent-monero transition-colors"
            >
              RETURN TO BLOCK LIST
            </Link>
          </section>
        )}
      </TuiContainer>
    </main>
  );
}
