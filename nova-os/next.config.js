/** @type {import('next').NextConfig} */
module.exports = {
  output: 'export',
  trailingSlash: true,
  basePath: process.env.PORTFOLIO_BASE_PATH || '',
  images: { unoptimized: true },
  reactStrictMode: true,
  turbopack: { root: __dirname },
};
