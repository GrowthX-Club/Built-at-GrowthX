import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Builders",
  description:
    "Top builders in the GrowthX community ranked by projects shipped and votes received.",
  alternates: {
    canonical: "https://built.growthx.club/builders",
  },
};

export default function BuildersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
