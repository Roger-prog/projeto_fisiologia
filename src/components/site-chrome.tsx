import { Activity, GraduationCap } from "lucide-react";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { AccessibilityControls } from "@/components/study/study-provider";

function Wordmark() {
  return (
    <Link className="wordmark" href="/" aria-label="FisioAcessível, página inicial">
      <span className="brand-symbol" aria-hidden="true">
        <Activity size={20} strokeWidth={2.4} />
      </span>
      <span>Fisio<span className="wordmark-accent">Acessível</span></span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <header className="site-header">
        <div className="site-shell header-inner">
          <Wordmark />
          <SiteNav />
          <AccessibilityControls />
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
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
