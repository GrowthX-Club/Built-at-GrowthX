import { buildDiscoveryIndex, fetchSkills, fetchSkillsFlags } from "@/lib/skills-api";

export async function loader() {
  const flags = await fetchSkillsFlags();
  if (!flags.marketplaceEnabled) {
    return new Response("Not Found", { status: 404, headers: { "Content-Type": "text/plain" } });
  }

  const skills = await fetchSkills({ sort: "installs", limit: 200 });

  return new Response(JSON.stringify(buildDiscoveryIndex(skills)), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
