import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // (ถ้าต้องการ) typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
