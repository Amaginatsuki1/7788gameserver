import type { ReactNode } from "react";

export type StatusTone =
  | "online"
  | "offline"
  | "unknown"
  | "planning"
  | "demo";

export function StatusBadge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: StatusTone;
}) {
  return (
    <span className={`status-badge status-${tone}`}>
      <span aria-hidden />
      {children}
    </span>
  );
}
