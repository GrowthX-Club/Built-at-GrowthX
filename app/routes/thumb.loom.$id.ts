import type { LoaderFunctionArgs } from "react-router";

// A still from a maker's Loom demo, for project cards that have no screenshot: Loom's oEmbed names the thumbnail
// (an animated .gif; the same path ends in .jpg for a still). Looked up once per server instance, then the browser
// and Vercel's edge keep the redirect for a day.
const cache = new Map<string, string | null>();

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params.id ?? "";
  if (!/^[a-zA-Z0-9]{16,64}$/.test(id)) throw new Response("Not Found", { status: 404 });
  if (!cache.has(id)) {
    let thumb: string | null = null;
    try {
      const r = await fetch(`https://www.loom.com/v1/oembed?url=${encodeURIComponent(`https://www.loom.com/share/${id}`)}`, { signal: AbortSignal.timeout(4000) });
      if (r.ok) {
        const url = String((await r.json()).thumbnail_url ?? "");
        if (/^https:\/\/cdn\.loom\.com\/\S+\.(gif|jpe?g|png)$/i.test(url)) thumb = url.replace(/\.gif$/i, ".jpg");
      }
    } catch { /* timeout or network: not cached, so the next request tries again */ return new Response("Unavailable", { status: 503 }); }
    cache.set(id, thumb);
  }
  const thumb = cache.get(id);
  if (!thumb) return new Response("Not Found", { status: 404, headers: { "Cache-Control": "public, max-age=3600" } });
  return new Response(null, { status: 302, headers: { Location: thumb, "Cache-Control": "public, max-age=86400, s-maxage=86400" } });
}
