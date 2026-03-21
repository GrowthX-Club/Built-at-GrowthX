export async function GET() {
  const content = `# Built at GrowthX

> A platform showcasing projects built by members of India's top product community.

Built at GrowthX is where members of GrowthX share, vote on, and discuss the products they've shipped. GrowthX is India's leading product and growth community with members across founders, product managers, designers, and engineers.

## Sections

- [Projects](https://built.growthx.club/projects) — Browse all shipped projects, sorted by votes or recency
- [Builders](https://built.growthx.club/builders) — Leaderboard of top builders ranked by reputation and projects shipped
- [Building](https://built.growthx.club/building) — Projects currently in progress (ideas, prototyping, beta)
- [Cities](https://built.growthx.club/cities) — City-wise breakdown of builders and projects shipped across India

## Features

- Project submission with screenshots, Loom demos, tech stack, and team attribution
- Weighted voting system based on member reputation (founders, hosts, builders, members)
- Threaded comments with emoji reactions
- Builder profiles with project portfolios and reputation scores
- City leaderboards tracking builder density and project output
- Buildathon events for community-wide shipping sprints

## Project Categories

AI tool, SaaS, Developer tool, Mobile app, Chrome extension, API, and more.

## Links

- Platform: https://built.growthx.club
- GrowthX: https://growthx.club
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
