/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
  reactStrictMode: true,
  experimental: {
    // runtime: 'nodejs',
    // serverComponents: true,
  },
};

export default nextConfig;
