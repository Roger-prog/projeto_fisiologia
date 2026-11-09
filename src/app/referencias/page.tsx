import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { ReferenceList } from "@/components/reference-list";
import { figureCredits, references } from "@/data";

export const metadata: Metadata = { title: "Referências e créditos" };

export default function ReferencesPage() {
  return (
    <div className="site-shell inner-page">
      <PageIntro category="Fontes" title="Referências e créditos">
        Consulte a bibliografia das aulas e a origem dos recursos visuais usados na plataforma.
      </PageIntro>

      <div className="source-grid">
        <section className="study-panel" aria-labelledby="bibliografia">
          <h2 id="bibliografia">Bibliografia das aulas</h2>
          <ReferenceList entries={references} />
        </section>
        <section className="study-panel" aria-labelledby="creditos">
          <h2 id="creditos">Créditos das ilustrações</h2>
          <ul className="reference-list" role="list">
            {figureCredits.map((credit) => (
              <li key={credit.id} id={credit.id} tabIndex={-1}>
                <h3>{credit.title}</h3>
                <dl className="credit-list">
                  <dt>Autoria</dt><dd>{credit.author}</dd>
                  <dt>Origem</dt><dd><a href={credit.source}>Arquivo SVG original</a></dd>
                  <dt>Licença</dt><dd>{credit.licenseUrl ? <a href={credit.licenseUrl}>{credit.license}</a> : credit.license}</dd>
                  <dt>Alterações</dt><dd>{credit.changes}</dd>
                </dl>
              </li>
            ))}
            <li>
              <h3>Ilustração da página inicial</h3>
              <dl className="credit-list">
                <dt>Autoria</dt><dd>FisioAcessível</dd>
                <dt>Origem</dt><dd><a href="/ilustracao-inicio.svg">Arquivo SVG original</a></dd>
                <dt>Licença</dt><dd>Licença pública de reutilização não definida</dd>
                <dt>Alterações</dt><dd>Criação original para uso decorativo na plataforma.</dd>
              </dl>
            </li>
            <li>
              <h3>Ícones e fontes</h3>
              <p>
                <a href="/licencas/lucide.txt">Ícones Lucide e Feather (ISC e MIT)</a>.
              </p>
              <p>
                Fontes <a href="/licencas/inter.txt">Inter</a> e{" "}
                <a href="/licencas/manrope.txt">Manrope</a> sob a SIL Open Font License 1.1.
              </p>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
