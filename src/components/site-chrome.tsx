"use client";

import { Activity, GraduationCap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import autonomyStyles from "@/components/autonomy/autonomy.module.css";
import { SiteNav } from "@/components/site-nav";
import { AccessibilityControls } from "@/components/study/study-provider";
import { isAutonomyPath } from "@/lib/autonomy-routes";

function Wordmark({ staticLabel = false }: { staticLabel?: boolean }) {
  const label = (
    <>
      <span className="brand-symbol" aria-hidden="true">
        <Activity size={20} strokeWidth={2.4} />
      </span>
      <span>Fisio<span className="wordmark-accent">Acessível</span></span>
    </>
  );
  return staticLabel ? (
    <span className="wordmark">{label}</span>
  ) : (
    <Link className="wordmark" href="/" aria-label="FisioAcessível, página inicial">{label}</Link>
  );
}

export function SiteHeader() {
  const autonomy = isAutonomyPath(usePathname());

  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <header className="site-header">
        <div className={`site-shell ${autonomy ? autonomyStyles.headerInner : "header-inner"}`}>
          <Wordmark staticLabel={autonomy} />
          {!autonomy && <SiteNav />}
          <AccessibilityControls />
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  if (isAutonomyPath(usePathname())) return null;

  return (
    <footer className="site-footer">
      <div className="site-shell footer-inner">
        <div>
          <Wordmark />
          <p>Fisiologia humana para a monitoria universitária.</p>
        </div>
        <div className="footer-meta">
          <GraduationCap size={18} aria-hidden="true" />
          <span>Engenharia Biomédica · Projeto piloto</span>
        </div>
      </div>
    </footer>
  );
}
