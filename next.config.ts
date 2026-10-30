import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the dev server be opened on a phone through a Cloudflare quick tunnel.
  allowedDevOrigins: ["*.trycloudflare.com"],
  // Hides the Next.js dev indicator; compile and runtime errors still show.
  devIndicators: false,
  // The map used to live at /maps in the portfolio; old links and bookmarks still work.
  async redirects() {
    return [
      { source: "/maps", destination: "/", permanent: true },
      { source: "/maps/:path*", destination: "/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
