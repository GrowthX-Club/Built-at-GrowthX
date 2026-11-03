import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { C, type Project } from "@/types";
import { COLLECTIONS } from "@/lib/collections";
import { itemListLd } from "@/lib/seo";
import type { FilterTab } from "@/components/ProjectListView";
import CollectionPage, { loadCollection } from "@/components/CollectionPage";
import SarvamBuildathonHero from "@/components/SarvamBuildathonHero";

const SARVAM = COLLECTIONS.find(c => c.slug === "sarvam")!;
export const loader = ({ request }: LoaderFunctionArgs) => loadCollection(request, SARVAM);

const PAGE_URL = "https://built.growthx.club/sarvam";
const OG_IMAGE_URL = `${PAGE_URL}/og-image.png`;
const PAGE_TITLE = "Sarvam Epoch Buildathon by GrowthX";
const SOCIAL_TITLE = "The buildathon that broke the internet. · Sarvam Epoch";
const SOCIAL_DESCRIPTION = "Engineers from Apple, Meta, Google, NVIDIA, Databricks, Cloudflare, Microsoft AI and India’s best technology companies came to build.";
const OG_IMAGE_ALT = "The buildathon that broke the internet — Sarvam Epoch Buildathon by GrowthX";

const SARVAM_FILTERS: FilterTab[] = [
  { key: "all", label: "All projects", predicate: () => true },
  { key: "top-15", label: "Top 15", predicate: (project: Project) => project.accolade === "top-15" },
];

const SARVAM_EVENT_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: PAGE_TITLE,
  description: SOCIAL_DESCRIPTION,
  url: PAGE_URL,
  image: [OG_IMAGE_URL],
  startDate: "2026-07-26",
  endDate: "2026-07-26",
  eventStatus: "https://schema.org/EventCompleted",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  location: {
    "@type": "Place",
    name: "Bengaluru",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bengaluru",
      addressRegion: "Karnataka",
      addressCountry: "IN",
    },
  },
  organizer: {
    "@type": "Organization",
    name: "GrowthX",
    url: "https://growthx.club",
  },
  sponsor: ["Bessemer", "Lightspeed", "Razorpay"].map((name) => ({
    "@type": "Organization",
    name,
  })),
  mainEntityOfPage: PAGE_URL,
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: PAGE_TITLE },
  { name: "description", content: SOCIAL_DESCRIPTION },
  { name: "robots", content: "index, follow, max-image-preview:large" },
  { property: "og:type", content: "website" },
  { property: "og:locale", content: "en_IN" },
  { property: "og:site_name", content: "Built at GrowthX" },
  { property: "og:url", content: PAGE_URL },
  { property: "og:title", content: SOCIAL_TITLE },
  { property: "og:description", content: SOCIAL_DESCRIPTION },
  { property: "og:image", content: OG_IMAGE_URL },
  { property: "og:image:secure_url", content: OG_IMAGE_URL },
  { property: "og:image:type", content: "image/png" },
  { property: "og:image:width", content: "1200" },
  { property: "og:image:height", content: "630" },
  { property: "og:image:alt", content: OG_IMAGE_ALT },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:url", content: PAGE_URL },
  { name: "twitter:title", content: SOCIAL_TITLE },
  { name: "twitter:description", content: SOCIAL_DESCRIPTION },
  { name: "twitter:image", content: OG_IMAGE_URL },
  { name: "twitter:image:alt", content: OG_IMAGE_ALT },
  { tagName: "link", rel: "canonical", href: PAGE_URL },
  { "script:ld+json": SARVAM_EVENT_SCHEMA },
  ...(data ? [{ "script:ld+json": itemListLd("Sarvam Epoch Buildathon projects", "/sarvam", data.list.projects) }] : []),
];

export default function SarvamPage() {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "var(--sans)" }}>
      <SarvamBuildathonHero />
      <div id="sarvam-projects" style={{ scrollMarginTop: 24 }}>
        <CollectionPage c={SARVAM} customFilters={SARVAM_FILTERS} hideTitle />
      </div>
    </div>
  );
}
