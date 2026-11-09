import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageIntro } from "@/components/page-intro";

export default function NotFound() {
  return (
    <div className="site-shell inner-page">
      <PageIntro category="Erro 404" title="Página não encontrada">
        Consulte os módulos para encontrar as aulas disponíveis.
      </PageIntro>
      <Link className="button button-primary" href="/modulos/">
        Ver módulos <ArrowRight size={19} aria-hidden="true" />
      </Link>
    </div>
  );
}
