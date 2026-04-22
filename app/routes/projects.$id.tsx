import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { redirect } from "react-router";
import ProjectDetailClient from "@/components/ProjectDetailClient";

const API_BASE =
  typeof process !== "undefined" && process.env?.VITE_API_URL
    ? process.env.VITE_API_URL
    : "http://localhost:8000/api/v1";

async function getProject(id: string) {
  try {
    const res = await fetch(`${API_BASE}/bx/projects/${id}`);
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
    project.tagline || project.description || "A project built at GrowthX";
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
    description: project.description || project.tagline || "",
    url: `https://built.growthx.club/projects/${canonicalSlug}`,
    applicationCategory: project.category || "WebApplication",
    ...(project.icon ? { image: project.icon } : {}),
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
    ...(project.icon
      ? [{ property: "og:image", content: project.icon }]
      : [{ property: "og:image", content: "/built-logo.svg" }]),
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
