import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { redirect } from "react-router";
import { bxApi } from "@/lib/api";
import ProjectDetailClient from "@/components/ProjectDetailClient";
import { extractPlainText, stripMarkdownLite } from "@/lib/editor-utils";
import { normalizeProject, projectImage } from "@/types";
import { SITE_URL, eventFor } from "@/lib/collections";
import { pageMeta, breadcrumbLd, DEFAULT_OG_IMAGE } from "@/lib/seo";

/** Plain, marker-free, single-line text for meta/JSON-LD descriptions */
function cleanDescription(raw: unknown): string {
  if (typeof raw !== "string" || !raw) return "";
  return stripMarkdownLite(extractPlainText(raw)).replace(/\s+/g, " ").trim();
}

async function getProject(id: string) {
  try {
    const res = await bxApi(`/projects/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.project || data || null;
  } catch {
    return null;
  }
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  const project = await getProject(id!);
  if (!project) throw new Response("Not Found", { status: 404 });

  // One URL per project: ObjectId links and old slugs (the backend resolves slug_aliases) go to the canonical slug.
  if (project.slug && project.slug !== id) {
    throw redirect(`/projects/${project.slug}`, 301);
  }

  return { project };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.project) return [{ title: "Project not found — Built at GrowthX" }];

  const raw = data.project;
  const p = normalizeProject(raw);
  const slug = p.slug || raw._id || p.id;
  const path = `/projects/${slug}`;
  const description = p.tagline || cleanDescription(raw.description) || "A project built at GrowthX";
  const people = [p.builder, ...(p.creators || [])].filter(b => b.name && b.name !== "Anonymous");
  const byline = people.map(b => b.name).join(", ");
  const image = projectImage(p, 1200);
  const event = eventFor(p.buildathon);

  return [
    ...pageMeta({
      title: `${p.name} — Built at GrowthX`,
      description: byline ? `${description} Built by ${byline}.` : description,
      path,
      image: image ?? DEFAULT_OG_IMAGE,
      type: "article",
    }),
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: p.name,
        headline: p.tagline || undefined,
        description: cleanDescription(raw.description) || p.tagline || "",
        url: `${SITE_URL}${path}`,
        ...(p.url ? { sameAs: p.url, installUrl: p.url } : {}),
        applicationCategory: p.skill ? "AI skill" : "WebApplication",
        operatingSystem: "Web",
        ...(image ? { image } : {}),
        ...(p.date ? { datePublished: p.date } : {}),
        ...(p.weighted > 0 ? { interactionStatistic: { "@type": "InteractionCounter", interactionType: "https://schema.org/LikeAction", userInteractionCount: p.weighted } } : {}),
        author: people.map(b => ({ "@type": "Person", name: b.name, ...(b.company ? { worksFor: { "@type": "Organization", name: b.company } } : {}) })),
        publisher: { "@type": "Organization", name: "GrowthX", url: "https://growthx.club" },
        keywords: p.stack.join(", ") || undefined,
      },
    },
    {
      "script:ld+json": breadcrumbLd([
        { name: "Built at GrowthX", path: "/" },
        ...(event ? [{ name: event.name, path: event.href }] : []),
        { name: p.name, path },
      ]),
    },
  ];
};

export default function ProjectDetailPage() {
  return <ProjectDetailClient />;
}
