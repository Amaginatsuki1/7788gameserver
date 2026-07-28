import type { NextConfig } from "next";

const nextConfig: NextConfig =
  process.env.NEXT_STATIC_EXPORT === "1"
    ? {
        output: "export",
        typescript: {
          tsconfigPath: "./tsconfig.static.json",
        },
      }
    : {};

export default nextConfig;
