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
  const [copied, setCopied] = useState(false);
  const addressPending = address.trim() === "" || address === "待定";

  async function copyAddress() {
    if (addressPending) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
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
        disabled={addressPending}
      >
        {addressPending ? "待定" : copied ? "已复制" : "复制"}
      </button>
    </div>
  );
}
