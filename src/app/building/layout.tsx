import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Building",
  description:
    "Projects currently being built by the GrowthX community. See what's in progress.",
  openGraph: {
    title: "Building — Built at GrowthX",
    description:
      "Projects currently being built by the GrowthX community. See what's in progress.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Building — Built at GrowthX",
    description:
      "Projects currently being built by the GrowthX community. See what's in progress.",
  },
  alternates: {
    canonical: "https://built.growthx.club/building",
  },
};

export default function BuildingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
