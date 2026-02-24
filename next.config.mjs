/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd2jc8dbhgm565a.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'dtoz3qm0nr91u.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'public-cdn.growthx.club',
      },
      {
        protocol: 'https',
        hostname: 'og-images.growthx.club',
      },
      {
        protocol: 'https',
        hostname: 'private-cdn.growthx.club',
      },
      {
        protocol: 'https',
        hostname: 'logo.clearbit.com',
      },
      {
        protocol: 'https',
        hostname: 'img.logo.dev',
      },
    ],
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
