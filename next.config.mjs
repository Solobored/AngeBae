/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['placeholder.svg'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },

  // ✅ move here instead of "experimental"
  serverExternalPackages: ['@supabase/supabase-js'],

  experimental: {
    serverExternalPackages: ['@supabase/ssr', '@supabase/supabase-js'],
  },
};

export default nextConfig;
