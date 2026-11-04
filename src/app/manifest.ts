import type { MetadataRoute } from "next";
import { getMessages } from "@/lib/i18n";

export default function manifest(): MetadataRoute.Manifest {
  const messages = getMessages("lt");
  return {
    name: messages.meta.siteName,
    short_name: "PlayTennis",
    description: messages.meta.description,
    lang: "lt",
    start_url: "/",
    display: "browser",
    background_color: "#fbfbfa",
    theme_color: "#0d2818",
    icons: [
      { src: "/icon.png", type: "image/png", sizes: "32x32" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  };
}
