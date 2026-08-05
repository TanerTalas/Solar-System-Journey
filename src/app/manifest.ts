import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Solar System Journey",
    short_name: "Solar System",
    description:
      "Fly the Sun to the last planet at true spacing, then meet each world up close: what it is, how big, how far, and the pictures we have of it.",
    start_url: "/",
    display: "standalone",
    background_color: "#05060c",
    theme_color: "#05060c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
