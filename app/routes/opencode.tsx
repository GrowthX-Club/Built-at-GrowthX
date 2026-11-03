import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import type { Project } from "@/types";
import { COLLECTIONS } from "@/lib/collections";
import CollectionPage, { loadCollection, collectionMeta } from "@/components/CollectionPage";
import type { FilterTab } from "@/components/ProjectListView";

const OPENCODE = COLLECTIONS.find(c => c.slug === "opencode")!;

const OPENCODE_FILTERS: FilterTab[] = [
  { key: "all", label: "All projects", predicate: () => true },
  { key: "top-15", label: "Top 15", predicate: (p: Project) => !!p.accolade },
  { key: "top-5", label: "Top 5", predicate: (p: Project) => !!p.accolade && p.accolade !== "top-15" },
  { key: "virality", label: "Virality", predicate: (p: Project) => p.track === "virality" },
  { key: "revenue", label: "Revenue", predicate: (p: Project) => p.track === "revenue" },
  { key: "maas", label: "MaaS", predicate: (p: Project) => p.track === "maas" },
];

export const loader = ({ request }: LoaderFunctionArgs) => loadCollection(request, OPENCODE);
export const meta: MetaFunction<typeof loader> = ({ data }) => collectionMeta(OPENCODE, data);

export default function OpenCodePage() {
  return <CollectionPage c={OPENCODE} customFilters={OPENCODE_FILTERS} />;
}
