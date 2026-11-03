import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { LinksFunction, MetaFunction } from "react-router";

import { ThemeProvider } from "@/context/ThemeContext";
import { LoginDialogProvider } from "@/context/LoginDialogContext";
import { NavProvider } from "@/context/NavContext";
import LoginDialog from "@/components/LoginDialog";
import AppNav from "@/components/AppNav";
import CanvasFlip from "@/components/CanvasFlip";

import "./globals.css";

/* ------------------------------------------------------------------ */
/*  links — Google Fonts + preconnects                                 */
/* ------------------------------------------------------------------ */
export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Instrument+Sans:wdth,wght@75..100,400..700&family=Instrument+Serif:ital@0;1&family=Newsreader:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&display=swap",
  },
  { rel: "icon", href: "/favicon-16.png", sizes: "16x16", type: "image/png" },
  { rel: "icon", href: "/favicon-32.png", sizes: "32x32", type: "image/png" },
  { rel: "icon", href: "/favicon.png", type: "image/png" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
];

/* ------------------------------------------------------------------ */
/*  meta — default SEO tags (pages can override via their own meta)    */
/* ------------------------------------------------------------------ */
export const meta: MetaFunction = () => [
  { title: "Built at GrowthX" },
  { name: "description", content: "Products and AI skills built by the GrowthX community." },
  { property: "og:site_name", content: "Built at GrowthX" },
  { property: "og:image", content: "https://built.growthx.club/og.png" },
  { name: "twitter:card", content: "summary_large_image" },
];

/* ------------------------------------------------------------------ */
/*  JSON-LD structured data                                            */
/* ------------------------------------------------------------------ */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Built at GrowthX",
  url: "https://built.growthx.club",
  description: "Products and AI skills built by the GrowthX community.",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://built.growthx.club/?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
  publisher: {
    "@type": "Organization",
    name: "GrowthX",
    url: "https://growthx.club",
    logo: {
      "@type": "ImageObject",
      url: "https://built.growthx.club/built-logo.svg",
    },
  },
};

/* ------------------------------------------------------------------ */
/*  Layout — wraps every route                                         */
/* ------------------------------------------------------------------ */
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("bx-theme");if(t==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}requestAnimationFrame(function(){requestAnimationFrame(function(){document.documentElement.classList.add("ready")})})})()`,
          }}
        />
      </head>
      <body className="font-sans bg-bg text-text antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

/* ------------------------------------------------------------------ */
/*  App — providers + shell chrome                                     */
/* ------------------------------------------------------------------ */
export default function App() {
  return (
    <ThemeProvider>
      <LoginDialogProvider>
        <NavProvider>
          <AppNav />
          <CanvasFlip>
            <Outlet />
            <LoginDialog />
          </CanvasFlip>
        </NavProvider>
      </LoginDialogProvider>
    </ThemeProvider>
  );
}
