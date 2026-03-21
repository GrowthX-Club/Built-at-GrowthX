import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cities",
  description:
    "GrowthX builders by city — see which cities are shipping the most projects.",
  openGraph: {
    title: "Cities — Built at GrowthX",
    description:
      "GrowthX builders by city — see which cities are shipping the most projects.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Cities — Built at GrowthX",
    description:
      "GrowthX builders by city — see which cities are shipping the most projects.",
  },
  alternates: {
    canonical: "https://built.growthx.club/cities",
  },
};

export default function CitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
