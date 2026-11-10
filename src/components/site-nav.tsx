"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Início" },
  { href: "/modulos/", label: "Módulos" },
  { href: "/minhas-revisoes/", label: "Minhas Revisões" },
  { href: "/simulacoes/", label: "Simulações" },
  { href: "/referencias/", label: "Referências" },
] as const;

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="site-nav" aria-label="Navegação principal">
      {items.map(({ href, label }) => {
        const current = pathname === href;
        const related =
          (href === "/modulos/" && pathname.startsWith("/aulas/")) ||
          (href === "/minhas-revisoes/" && pathname === "/revisao/") ||
          (href === "/simulacoes/" && pathname.startsWith("/simulacoes/"));

        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : related ? "location" : undefined}
            data-active={current || related ? "" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
