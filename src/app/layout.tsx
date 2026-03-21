import type { Metadata } from "next";
import { DM_Sans, DM_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { LoginDialogProvider } from "@/context/LoginDialogContext";
import { NavProvider } from "@/context/NavContext";
import { ThemeProvider } from "@/context/ThemeContext";
import LoginDialog from "@/components/LoginDialog";
import AppNav from "@/components/AppNav";
import CanvasFlip from "@/components/CanvasFlip";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--mono",
  display: "swap",
  weight: ["400", "500"],
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--serif",
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://built.growthx.club"),
  title: {
    default: "Built at GrowthX",
    template: "%s — Built at GrowthX",
  },
  description:
    "Discover what the GrowthX community is shipping — projects, builders, and city stats from India's top product community.",
  openGraph: {
    type: "website",
    siteName: "Built at GrowthX",
    title: "Built at GrowthX",
    description:
      "Discover what the GrowthX community is shipping — projects, builders, and city stats.",
    images: ["/built-logo.svg"],
  },
  twitter: {
    card: "summary",
    title: "Built at GrowthX",
    description:
      "Discover what the GrowthX community is shipping — projects, builders, and city stats.",
  },
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: "https://built.growthx.club",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Built at GrowthX",
  url: "https://built.growthx.club",
  description:
    "Discover what the GrowthX community is shipping — projects, builders, and city stats from India's top product community.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${dmMono.variable} ${newsreader.variable}`}
    >
      <head>
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
        <ThemeProvider>
          <LoginDialogProvider>
            <NavProvider>
              <AppNav />
              <CanvasFlip>
                {children}
                <LoginDialog />
              </CanvasFlip>
            </NavProvider>
          </LoginDialogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
