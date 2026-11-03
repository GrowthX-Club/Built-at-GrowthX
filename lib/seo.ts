import { SITE_URL, type RawProject } from "@/lib/collections";

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og.png`;

/** Title, description, canonical, Open Graph and Twitter tags for one page. */
export function pageMeta({ title, description, path, image = DEFAULT_OG_IMAGE, type = "website" }: {
  title: string; description: string; path: string; image?: string; type?: string;
}) {
  const url = `${SITE_URL}${path === "/" ? "" : path}`;
  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:type", content: type },
    { property: "og:site_name", content: "Built at GrowthX" },
    { property: "og:url", content: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];
}

/** schema.org ItemList of project pages, in the order shown. */
export function itemListLd(name: string, path: string, projects: RawProject[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    numberOfItems: projects.length,
    itemListElement: projects.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/projects/${p.slug || p._id || p.id}`,
      name: String(p.name ?? ""),
    })),
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path === "/" ? "" : it.path}`,
    })),
  };
}
