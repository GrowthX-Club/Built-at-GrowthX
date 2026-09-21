import { buildDiscoveryIndex, fetchAllSkills, fetchSkillsFlags } from "@/lib/skills-api";

export async function loader() {
  const flags = await fetchSkillsFlags();
  if (!flags.marketplaceEnabled) {
    return new Response("Not Found", { status: 404, headers: { "Content-Type": "text/plain" } });
  }

  const registry = await fetchAllSkills({ sort: "installs" });
  // The CLI reads an empty index as "this registry has no skills", so a failed read must not be cached.
  if (!registry.ok) {
    return new Response(JSON.stringify({ error: "skill registry unavailable" }), {
      status: 502,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  return new Response(JSON.stringify(buildDiscoveryIndex(registry.skills)), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
