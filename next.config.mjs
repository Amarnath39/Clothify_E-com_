/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: "standalone",
  
  // Allow images from production domain (for PWA)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.swaarasya.com',
        pathname: '/assets/server/**',
      },
    ],
  },
  
  // Proxy /assets/server/* to production (for local development)
  async rewrites() {
    return [
      {
        source: '/assets/server/:path*',
        destination: 'https://www.swaarasya.com/assets/server/:path*',
      },
    ];
  },
};

export default nextConfig;
