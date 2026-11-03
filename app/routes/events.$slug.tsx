import { redirect } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { COLLECTIONS } from "@/lib/collections";
import CollectionPage, { loadCollection, collectionMeta, type CollectionData } from "@/components/CollectionPage";

// Event pages without a route of their own (e.g. /events/openclaw); the others redirect to theirs.
export async function loader({ request, params }: LoaderFunctionArgs) {
  const c = COLLECTIONS.find(x => x.slug === params.slug);
  if (!c) throw new Response("Not Found", { status: 404 });
  if (c.path !== `/events/${c.slug}`) throw redirect(c.path, 301);
  return { slug: c.slug, ...(await loadCollection(request, c)) };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const c = COLLECTIONS.find(x => x.slug === data?.slug);
  return c ? collectionMeta(c, data as CollectionData) : [{ title: "Not found — Built at GrowthX" }];
};

export default function EventPage({ loaderData }: { loaderData: { slug: string } }) {
  const c = COLLECTIONS.find(x => x.slug === loaderData.slug)!;
  return <CollectionPage c={c} />;
}
