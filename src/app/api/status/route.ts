import { NextResponse } from "next/server";
import { getNetworkStats } from "@/actions/get-network-stats";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await getNetworkStats();

    return NextResponse.json(status, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: "[!] SYSTEM_OFFLINE: UNABLE TO REACH AGGREGATOR.",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }
}
