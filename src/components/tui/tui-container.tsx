import type { ReactNode } from "react";

export function TuiContainer({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto my-2 sm:my-4 w-full max-w-5xl border border-white/30 bg-background p-2 sm:p-4">
      {children}
    </div>
  );
}
