"use client";

import { useState } from "react";

export function AddressBlock({
  compact = false,
  address = "tr.7788oio.icu:18035",
  label = "SERVER ADDRESS",
}: {
  compact?: boolean;
  address?: string;
  label?: string;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const addressPending = address.trim() === "" || address === "待定";

  async function copyAddress() {
    if (addressPending) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    } finally {
      window.setTimeout(() => setCopyState("idle"), 1800);
    }
  }

  return (
    <div className={`address-block ${compact ? "address-compact" : ""}`}>
      <div>
        <span className="mono-label">{label}</span>
        <code>{address}</code>
      </div>
      <button
        type="button"
        onClick={copyAddress}
        aria-label={addressPending ? "服务器地址待定" : "复制服务器地址"}
        aria-live="polite"
        disabled={addressPending}
      >
        {addressPending
          ? "待定"
          : copyState === "copied"
            ? "已复制"
            : copyState === "failed"
              ? "复制失败"
              : "复制"}
      </button>
    </div>
  );
}
