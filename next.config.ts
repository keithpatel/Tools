import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  experimental: {
    // Barrel `import * as LucideIcons` defeats tree-shaking without this —
    // rewrites to per-icon imports, big client-bundle win across ~96 tools.
    optimizePackageImports: ["lucide-react"],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
