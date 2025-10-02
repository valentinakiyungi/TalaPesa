
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedDevOrigins: ['http://192.168.1.199:3000', 'http://localhost:3000'],
  },
};

module.exports = nextConfig;
