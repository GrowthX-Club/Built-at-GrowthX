import { useState } from "react";
import { Link, useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { type SortKey, fetchProjects, listParams } from "@/lib/collections";
import { pageMeta, itemListLd, breadcrumbLd } from "@/lib/seo";
import ProjectListView from "@/components/ProjectListView";
import SearchBox from "@/components/SearchBox";
import { ConnectCard } from "@/components/SkillUse";

const DESCRIPTION =
  "Skills GrowthX members built to teach AI a job they know. Add any of them to Claude, ChatGPT, Claude Code or Codex.";
const SORTS: SortKey[] = ["installs", "trending", "new"];

export async function loader({ request }: LoaderFunctionArgs) {
  const { sort, q } = listParams(request.url, SORTS);
  return { list: await fetchProjects({ has_skill: true, sort, limit: 20 }), sort, q };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  ...pageMeta({ title: "Skills — Built at GrowthX", description: DESCRIPTION, path: "/skills" }),
  ...(data ? [{ "script:ld+json": itemListLd("Skills built at GrowthX", "/skills", data.list.projects) }] : []),
  { "script:ld+json": breadcrumbLd([{ name: "Built at GrowthX", path: "/" }, { name: "Skills", path: "/skills" }]) },
];

// Same frame as the home page: list on the left, the how-to card beside it on desktop.
export default function SkillsPage() {
  const data = useLoaderData<typeof loader>();
  const [query, setQuery] = useState(data.q);
  return (
    <main className="page">
      <header className="page-head">
        <h1 className="page-title">Skills the community built</h1>
        <p className="page-sub">Each one teaches your AI a job, the way a GrowthX member does it. GrowthX checks every skill before it's listed.</p>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginTop: 16 }}>
          {/* The same Submit chooser as the nav's Submit, opened on "A skill". */}
          <Link to="/?submit=skill" className="btn-outline">Add your skill</Link>
        </div>
        {(data.list.error || data.list.totalCount >= 10) && <SearchBox value={query} onChange={setQuery} placeholder="Search skills" />}
      </header>
      <div className="home-cols" style={{ marginTop: 8 }}>
        <ProjectListView
          initial={data.list}
          skillsOnly
          sorts={SORTS}
          sort={data.sort}
          query={query}
          onClearQuery={() => setQuery("")}
          emptyState={{ title: "No skills yet", description: "Skills members upload show up here once GrowthX has checked them." }}
        />
        <aside style={{ order: 1 }}><ConnectCard /></aside>
      </div>
    </main>
  );
}
