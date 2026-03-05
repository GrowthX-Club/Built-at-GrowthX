import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Building",
  description:
    "Projects currently being built by the GrowthX community. See what's in progress.",
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
