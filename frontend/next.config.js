/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow fetches to the backend container name in server components
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.INTERNAL_API_URL ?? "http://localhost:8080"}/api/:path*`,
      },
    ];
  },
  // Allow images from any source for doctor avatars
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
