/** @type {import('next').NextConfig} */
const config = {
 distDir:process.env.PATCHMAN_BUILD_DIR || ".next",
  poweredByHeader: false,
  reactStrictMode: true,
};

export default config;
