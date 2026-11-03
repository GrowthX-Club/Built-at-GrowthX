import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { BUILD_SPRINT } from "@/lib/collections";
import CollectionPage, { loadCollection, collectionMeta } from "@/components/CollectionPage";

export const loader = ({ request }: LoaderFunctionArgs) => loadCollection(request, BUILD_SPRINT);
export const meta: MetaFunction<typeof loader> = ({ data }) => collectionMeta(BUILD_SPRINT, data);

export default function BuildSprintPage() {
  return <CollectionPage c={BUILD_SPRINT} />;
}
