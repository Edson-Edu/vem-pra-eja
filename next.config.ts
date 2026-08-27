import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/Edson-Edu/vem-pra-eja/main/assets/logos/**",
      },
    ],
  },

  allowedDevOrigins: ["10.170.0.18"],
  
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    NEXT_PUBLIC_AZURE_VOICE_FUNCTION_URL: process.env.AZURE_VOICE_FUNCTION_URL ?? "https://vempraeja-voz-2026-fccbhjhadwekfncu.centralus-01.azurewebsites.net/api/voz",
  },
};

export default nextConfig;
