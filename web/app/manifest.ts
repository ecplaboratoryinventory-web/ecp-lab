import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ECP Lab — Laboratory Inventory Management",
    short_name: "ECP Lab",
    description:
      "Engineering Laboratory Inventory Management System for STI College Cotabato",
    start_url: "/",
    display: "standalone",
    background_color: "#f2f5f9",
    theme_color: "#1A2980",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
