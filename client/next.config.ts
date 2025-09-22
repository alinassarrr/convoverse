import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Disable telemetry
  telemetry: false,
  // Enable experimental features if needed
  experimental: {
    // Add any experimental features you need
  },
};

export default nextConfig;
