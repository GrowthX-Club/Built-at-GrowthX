import { useLoaderData } from "react-router";
import type { MetaFunction } from "react-router";
import { BUILD_SPRINT, SITE_URL, fetchCollectionStats, collectionStat, listedCollections } from "@/lib/collections";
import { pageMeta, breadcrumbLd } from "@/lib/seo";
import CollectionCard from "@/components/CollectionCard";

export async function loader() {
  const stats = await fetchCollectionStats();
  return { stats };
}

const DESCRIPTION = "Build Sprint and the GrowthX buildathons, with every project members shipped at each one.";

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  ...pageMeta({ title: "Events — Built at GrowthX", description: DESCRIPTION, path: "/events" }),
  {
    "script:ld+json": {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "GrowthX build events",
      itemListElement: listedCollections(data?.stats ?? { tags: {}, categories: [], error: true }).map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, url: `${SITE_URL}${c.path}` })),
    },
  },
  { "script:ld+json": breadcrumbLd([{ name: "Built at GrowthX", path: "/" }, { name: "Events", path: "/events" }]) },
];

export default function EventsPage() {
  const { stats } = useLoaderData<typeof loader>();
  // Build Sprint first, then the buildathons by their latest project; events under 5 projects stay off the list.
  const others = listedCollections(stats).filter(c => c !== BUILD_SPRINT)
    .sort((a, b) => (collectionStat(b, stats).lastAt ?? "").localeCompare(collectionStat(a, stats).lastAt ?? ""));
  return (
    <main className="page">
      <header className="page-head">
        <h1 className="page-title">Events</h1>
        <p className="page-sub">{DESCRIPTION}</p>
      </header>
      <div className="events-grid">
        {[BUILD_SPRINT, ...others].map(c => <CollectionCard key={c.slug} c={c} stats={stats} blurb />)}
      </div>
    </main>
  );
}
