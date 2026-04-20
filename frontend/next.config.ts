import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isProd ? "/its_jayas_avocado" : "",
  assetPrefix: isProd ? "/its_jayas_avocado/" : "",
};

export default nextConfig;
