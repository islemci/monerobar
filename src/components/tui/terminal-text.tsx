import type { ElementType, ReactNode } from "react";

interface TerminalTextProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
}

export function TerminalText({
  as: Component = "span",
  children,
  className = "",
}: TerminalTextProps) {
  return (
    <Component
      className={`font-mono text-xs uppercase tracking-[0.12em] text-zinc-400 ${className}`.trim()}
    >
      {children}
    </Component>
  );
}
