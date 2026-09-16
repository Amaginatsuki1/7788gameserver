/** Public browser settings. Never place credentials in NEXT_PUBLIC_* variables. */
export const siteConfig = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://7788oio.icu",
  statusApiUrl: process.env.NEXT_PUBLIC_STATUS_API_URL || "https://7788oio.icu/api/status",
  gameProbeUrl: process.env.NEXT_PUBLIC_GAME_PROBE_URL || "https://tr.7788oio.icu:28443/ping",
};
