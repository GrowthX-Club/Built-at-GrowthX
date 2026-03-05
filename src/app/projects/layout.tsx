import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Browse all projects built by the GrowthX community — discover, vote, and comment.",
  alternates: {
    canonical: "https://built.growthx.club/projects",
  },
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
