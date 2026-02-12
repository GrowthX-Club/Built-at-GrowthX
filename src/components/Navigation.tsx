"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { name: "Projects", href: "/" },
  { name: "Events", href: "/events" },
  { name: "Timeline", href: "/timeline" },
  { name: "Builders", href: "/builders" },
  { name: "Cities", href: "/cities" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border px-6">
      <div className="max-w-6xl mx-auto flex gap-6">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/" || pathname.startsWith("/projects")
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`py-3 text-sm font-medium transition-colors border-b-2 ${
                isActive
                  ? "text-dark border-orange"
                  : "text-secondary border-transparent hover:text-dark"
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
