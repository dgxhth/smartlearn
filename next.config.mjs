/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  images: {
    domains: ['localhost'],
  },
  // 确保prisma的db文件能被包含
  outputFileTracingIncludes: {
    '/api/**': ['./prisma/**'],
  },
};

export default nextConfig;
