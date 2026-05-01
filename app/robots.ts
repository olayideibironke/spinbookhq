// FILE: app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/auth/", "/login", "/reset-password"],
      },
    ],
    sitemap: "https://www.spinbookhq.com/sitemap.xml",
  };
}
