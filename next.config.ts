import type { NextConfig } from "next";

import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  serverExternalPackages: ["@mysten/walrus", "@mysten/walrus-wasm"],
  images: {
    qualities: [100, 75],
  },
};

export default withNextIntl(nextConfig);
