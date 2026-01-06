import withPWA from '@ducanh2912/next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: undefined,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wger.de',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'vytveiwzomclnphosjsh.supabase.co',
        pathname: '/storage/v1/object/public/member-photos/**',
      },
      {
        protocol: 'https',
        hostname: 'auoljtzkmfnmwzfbwdwq.supabase.co',
        pathname: '/storage/v1/object/public/member-photos/**',
      },
    ],
  },
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
})(nextConfig);