/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@netify/config', '@netify/types', '@netify/validation'],
};

module.exports = nextConfig;
