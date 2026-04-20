import type { ReactNode } from "react";

interface TuiBoxProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function TuiBox({ title, children, className = "" }: TuiBoxProps) {
  return (
    <section className={`border border-white/10 bg-black p-4 ${className}`.trim()}>
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-muted">
        [ {title.toUpperCase()} ]
      </p>
      {children}
    </section>
  );
}
