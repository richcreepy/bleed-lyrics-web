/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    BACKEND_URL: "https://bleed-lyrics.vercel.app"
  }
};

module.exports = nextConfig;
