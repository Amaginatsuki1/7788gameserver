import type { ReactNode } from "react";

export function StatusBadge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "online" | "planning" | "demo";
}) {
  return (
    <span className={`status-badge status-${tone}`}>
      <span aria-hidden />
      {children}
    </span>
  );
}
