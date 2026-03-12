/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Necesario para Docker/Cloud Run
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
