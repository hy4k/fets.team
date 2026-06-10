/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'duexkufmxqfnzlbrdmhc.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig
