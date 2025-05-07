/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['tonejs.github.io'],
    unoptimized: true,
  },
  // Ensure Tone.js works properly with Next.js
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Make sure there are no settings that might affect routing
  // Check if there's any basePath or output settings that could cause issues

  // If there are any problematic settings, remove or comment them out
};

export default nextConfig;
