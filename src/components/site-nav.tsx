"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Início" },
  { href: "/modulos/", label: "Módulos" },
  { href: "/revisao/", label: "Revisão rápida" },
  { href: "/referencias/", label: "Referências" },
] as const;

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="site-nav" aria-label="Navegação principal">
      {items.map(({ href, label }) => {
        const current = pathname === href;
        const withinModules = href === "/modulos/" && pathname.startsWith("/aulas/");

        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            data-active={current || withinModules ? "" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
