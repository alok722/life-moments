import type { MetadataRoute } from "next";

const ICON_VERSION = "v3";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Life Moments",
    short_name: "Life Moments",
    description: "Never miss a moment that matters.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#7c5cfc",
    orientation: "portrait",
    categories: ["lifestyle", "utilities"],
    icons: [
      {
        src: `/icons/icon-192.svg?${ICON_VERSION}`,
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: `/icons/icon-192.png?${ICON_VERSION}`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: `/icons/icon-512.png?${ICON_VERSION}`,
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: `/icons/icon-maskable-512.png?${ICON_VERSION}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
