import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@koillection/ui", "@koillection/lib", "@koillection/db"],
  images: {
    localPatterns: [
      {
        pathname: "/uploads/**",
        search: "",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  typescript: {
    // Ignora errori TypeScript durante il build (da rimuovere a stabilizzazione)
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
