/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedDevOrigins: [
      'localhost:3000',
      '127.0.0.1:3000',
      '0.0.0.0:3000',
      '10.232.87.23:3000'
    ]
  }
}

module.exports = nextConfig