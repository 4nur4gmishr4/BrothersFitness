import withPWA from '@ducanh2912/next-pwa';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  outputFileTracingRoot: path.resolve(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'auoljtzkmfnmwzfbwdwq.supabase.co',
        pathname: '/storage/v1/object/public/member-photos/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          }
        ]
      }
    ]
  }
};

export default withPWA({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: true,
  // Default (false): navigations are NetworkFirst, so online users always get
  // freshly-built HTML instead of a precached shell that points at deleted
  // chunk hashes after a deploy. Offline still serves the cached app shell.
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  workboxOptions: {
    // Keep the old service worker in charge until the user opts in via the
    // PwaUpdateToast "Reload" action (which posts SKIP_WAITING; workbox's
    // generated SW always wires that message listener). Auto-activation
    // mid-session can swap chunk hashes under a live page and 404 on the new
    // build's assets. NOTE: skipWaiting/clientsClaim must live here â€” they are
    // only read from workboxOptions (top-level flags are silently ignored).
    skipWaiting: false,
  },
})(nextConfig);


