/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // unpdf 는 서버에서만 사용한다.
  serverExternalPackages: ["unpdf"],
};

export default nextConfig;
