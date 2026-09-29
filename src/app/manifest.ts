import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Farmr — Gestión de Granjas",
    short_name: "Farmr",
    description: "Controlá cultivos, ganado, tareas e inventario de tu granja.",
    lang: "es-PY",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#15803d",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
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
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
