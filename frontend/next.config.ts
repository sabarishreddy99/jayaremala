import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isProd ? "/jayaremala" : "",
  assetPrefix: isProd ? "/jayaremala/" : "",
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? "/jayaremala" : "",
  },
};

export default nextConfig;
