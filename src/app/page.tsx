import Link from "next/link";
import { ArrowRight, ArrowUpRight, AudioLines, Keyboard, ScanText } from "lucide-react";
import { ModuleSymbol } from "@/components/module-symbol";
import { ResumeStudy } from "@/components/study/study-provider";
import { modules } from "@/data";

const features = [
  {
    Icon: AudioLines,
    title: "Leitura em voz alta",
    description: "Ouça o texto da aula e escolha a velocidade da leitura.",
  },
  {
    Icon: ScanText,
    title: "Visualização ajustável",
    description: "Aumente o texto e ative o alto contraste no menu de acessibilidade.",
  },
  {
    Icon: Keyboard,
    title: "Navegação por teclado",
    description: "Percorra as páginas e responda aos exercícios com o teclado.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="site-shell hero" aria-labelledby="titulo-inicio">
        <div className="hero-content">
          <p className="eyebrow"><span className="indicator" />Monitoria de Fisiologia</p>
          <h1 id="titulo-inicio">Fisiologia humana, <span>ao seu ritmo.</span></h1>
          <p className="hero-description">
            Explore o funcionamento do corpo humano com aulas acessíveis, diagramas descritos,
            leitura em voz alta e exercícios comentados.
          </p>
          <div className="control-row hero-actions">
            <Link className="button button-primary" href="/modulos/">
              Começar a estudar <ArrowRight size={19} aria-hidden="true" />
            </Link>
            <Link className="button button-secondary" href="/autonomia/">
              Estudar com acessibilidade por voz <AudioLines size={19} aria-hidden="true" />
            </Link>
          </div>
          <ResumeStudy />
          <p className="hero-note">Para estudantes de graduação · Engenharia Biomédica</p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-art-label"><span />Caderno de estudos</div>
          {/* The decorative SVG has no instructional content. */}
          <img src="/ilustracao-inicio.svg" alt="" width={540} height={420} fetchPriority="high" />
          <div className="hero-art-caption">
            <span>Fisiologia humana</span>
            <span>Vol. 01</span>
          </div>
        </div>
      </section>

      <section className="site-shell home-modules" aria-labelledby="modulos-inicio">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><span className="indicator" />Conteúdos</p>
            <h2 id="modulos-inicio">Sistemas fisiológicos</h2>
          </div>
          <Link className="text-link" href="/modulos/">
            Ver todos os módulos <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <ul className="module-grid" role="list">
          {modules.map((module, index) => {
            const available = module.topics.filter((topic) => topic.lessonId).length;

            return (
              <li key={module.id} className="module-card">
                <div className="card-topline">
                  <ModuleSymbol moduleId={module.id} />
                  <span className="card-number">Módulo {String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3><Link href={`/modulos/#${module.id}`}>{module.title}</Link></h3>
                <p>{module.description}</p>
                <div className="card-footer">
                  <span className="status-pill">
                    <span className="indicator" />
                    {available} {available === 1 ? "aula disponível" : "aulas disponíveis"}
                  </span>
                  <ArrowRight size={20} aria-hidden="true" />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="access-band" aria-labelledby="acessibilidade-inicio">
        <div className="site-shell access-inner">
          <div className="section-heading">
            <div>
              <p className="eyebrow"><span className="indicator" />Acessibilidade</p>
              <h2 id="acessibilidade-inicio">Escolha como estudar</h2>
              <p>Leia, ouça ou pratique. Os recursos podem ser usados juntos ou separadamente.</p>
            </div>
            <Link className="text-link" href="/minhas-revisoes/">
              Abrir Minhas Revisões <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <ul className="feature-grid" role="list">
            {features.map(({ Icon, title, description }) => (
              <li key={title} className="feature">
                <Icon size={25} strokeWidth={1.75} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
