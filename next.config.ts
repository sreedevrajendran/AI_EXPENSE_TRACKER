import type { NextConfig } from "next";
// @ts-ignore next-pwa doesn't have types
const withPWA = require("next-pwa")({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
});

const nextConfig: NextConfig = {
    turbopack: {},
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "lh3.googleusercontent.com" },
            { protocol: "https", hostname: "avatars.githubusercontent.com" },
            { protocol: "https", hostname: "utfs.io" },
        ],
    },
};

module.exports = withPWA(nextConfig);
