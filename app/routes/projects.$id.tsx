import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { redirect } from "react-router";
import ProjectDetailClient from "@/components/ProjectDetailClient";
import { extractPlainText, stripMarkdownLite } from "@/lib/editor-utils";

/** Plain, marker-free, single-line text for meta/JSON-LD descriptions */
function cleanDescription(raw: unknown): string {
  if (typeof raw !== "string" || !raw) return "";
  return stripMarkdownLite(extractPlainText(raw)).replace(/\s+/g, " ").trim();
}

const API_BASE =
  typeof process !== "undefined" && process.env?.VITE_API_URL
    ? process.env.VITE_API_URL
    : "http://localhost:8000/api/v1";

const UNAVAILABLE = () =>
  new Response("The projects service didn't answer. Try again.", { status: 503 });

/**
 * The project, or null when the API says it doesn't exist. A failing or unreachable API is a 503 (try again later),
 * never a 404: a 404 tells search engines the page is gone.
 */
async function getProject(id: string) {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/bx/projects/${encodeURIComponent(id)}`);
  } catch {
    throw UNAVAILABLE();
  }
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) throw UNAVAILABLE();
  let data;
  try {
    data = await res.json();
  } catch {
    throw UNAVAILABLE();
  }
  return data?.project || data || null;
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  const project = await getProject(id!);
  if (!project) throw new Response("Not Found", { status: 404 });

  // Redirect ObjectId URLs to slug URLs
  if (project.slug && /^[0-9a-fA-F]{24}$/.test(id!) && project.slug !== id) {
    throw redirect(`/projects/${project.slug}`, 301);
  }

  return { project };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.project) {
    return [{ title: "Project Not Found" }];
  }

  const project = data.project;
  const title = project.name || "Project";
  const description =
    project.tagline || cleanDescription(project.description) || "A project built at GrowthX";
  const builderName = project.builderName || project.builder?.name || "";
  const fullDescription = builderName
    ? `${description} — by ${builderName}`
    : description;

  const canonicalSlug = project.slug || project._id || project.id;

  // JSON-LD SoftwareApplication schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: title,
    description: cleanDescription(project.description) || project.tagline || "",
    url: `https://built.growthx.club/projects/${canonicalSlug}`,
    applicationCategory: project.category || "WebApplication",
    author: {
      "@type": "Person",
      name: builderName || "GrowthX Builder",
    },
    publisher: {
      "@type": "Organization",
      name: "GrowthX",
      url: "https://growthx.club",
    },
  };

  return [
    { title },
    { name: "description", content: fullDescription },
    { property: "og:title", content: `${title} — Built at GrowthX` },
    { property: "og:description", content: description },
    { property: "og:type", content: "article" },
    { property: "og:image", content: "/built-logo.svg" },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: `${title} — Built at GrowthX` },
    { name: "twitter:description", content: description },
    { tagName: "link", rel: "canonical", href: `https://built.growthx.club/projects/${canonicalSlug}` },
    {
      "script:ld+json": jsonLd,
    },
  ];
};

export default function ProjectDetailPage() {
  return <ProjectDetailClient />;
}
