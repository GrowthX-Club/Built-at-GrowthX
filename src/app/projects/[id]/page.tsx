import { Metadata } from "next";
import ProjectDetailClient from "./ProjectDetailClient";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type Props = {
  params: { id: string };
};

async function getProject(id: string) {
  try {
    const res = await fetch(`${API_BASE}/bx/projects/${id}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.project || data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = params;
  const project = await getProject(id);

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  const title = project.name || "Project";
  const description =
    project.tagline || project.description || "A project built at GrowthX";
  const builderName = project.builderName || project.builder?.name || "";

  return {
    title,
    description: builderName
      ? `${description} — by ${builderName}`
      : description,
    openGraph: {
      title: `${title} — Built at GrowthX`,
      description,
      type: "article",
      images: project.icon ? [project.icon] : ["/built-logo.svg"],
    },
    twitter: {
      card: "summary",
      title: `${title} — Built at GrowthX`,
      description,
    },
    alternates: {
      canonical: `https://built.growthx.club/projects/${project.slug || id}`,
    },
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = params;
  const project = await getProject(id);

  const jsonLd = project
    ? {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: project.name,
        description:
          project.tagline || project.description || "A project built at GrowthX",
        url: `https://built.growthx.club/projects/${project.slug || id}`,
        applicationCategory: project.category || "WebApplication",
        ...(project.url && { installUrl: project.url }),
        author: {
          "@type": "Person",
          name:
            (project.creator?.name?.first
              ? `${project.creator.name.first} ${project.creator.name.last || ""}`.trim()
              : undefined) || "GrowthX Builder",
        },
        publisher: {
          "@type": "Organization",
          name: "GrowthX",
          url: "https://growthx.club",
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProjectDetailClient />
    </>
  );
}
