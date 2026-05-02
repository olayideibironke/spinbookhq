// FILE: app/sitemap.ts
import { MetadataRoute } from "next";

const SITE_URL = "https://www.spinbookhq.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL,                          lastModified: new Date(), changeFrequency: "daily",  priority: 1.0 },
    { url: `${SITE_URL}/djs`,                 lastModified: new Date(), changeFrequency: "daily",  priority: 0.9 },
    { url: `${SITE_URL}/djs/toronto`,         lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_URL}/djs/new-york`,        lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_URL}/djs/los-angeles`,     lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_URL}/djs/baltimore`,       lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_URL}/djs/saint-louis`,     lastModified: new Date(), changeFrequency: "weekly", priority: 0.80 },
    { url: `${SITE_URL}/djs/charlotte`,       lastModified: new Date(), changeFrequency: "weekly", priority: 0.80 },
    { url: `${SITE_URL}/djs/las-vegas`,       lastModified: new Date(), changeFrequency: "weekly", priority: 0.80 },
    { url: `${SITE_URL}/djs/phoenix`,         lastModified: new Date(), changeFrequency: "weekly", priority: 0.80 },
    { url: `${SITE_URL}/contact`,             lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/dj-waitlist`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];
}
