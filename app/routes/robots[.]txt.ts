import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /settings
Disallow: /my-projects
Disallow: /login

Sitemap: https://built.growthx.club/sitemap.xml
`;

  return new Response(robotsTxt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
