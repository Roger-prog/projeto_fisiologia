import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ModuleSymbol } from "@/components/module-symbol";
import { PageIntro } from "@/components/page-intro";
import { modules } from "@/data";

export const metadata: Metadata = { title: "Módulos de estudo" };

export default function ModulesPage() {
  return (
    <div className="site-shell inner-page">
      <PageIntro category="Biblioteca" title="Módulos de estudo">
        Explore os tópicos de cada sistema e escolha uma aula disponível para começar.
      </PageIntro>

      <div className="module-grid module-catalog">
        {modules.map((module, index) => (
          <section
            className="catalog-card"
            key={module.id}
            id={module.id}
            aria-labelledby={`titulo-${module.id}`}
            tabIndex={-1}
          >
            <header>
              <div className="card-topline">
                <ModuleSymbol moduleId={module.id} />
                <span className="card-number">Módulo {String(index + 1).padStart(2, "0")}</span>
              </div>
              <h2 id={`titulo-${module.id}`}>{module.title}</h2>
              <p>{module.description}</p>
            </header>
            <ol className="topic-list" role="list">
              {module.topics.map((topic, topicIndex) => (
                <li key={topic.id} className={topic.lessonId ? "topic topic-ready" : "topic"}>
                  <span className="topic-index" aria-hidden="true">
                    {String(topicIndex + 1).padStart(2, "0")}
                  </span>
                  <div className="topic-copy">
                    {topic.lessonId ? (
                      <Link href={`/aulas/${topic.lessonId}/`}>{topic.title}</Link>
                    ) : (
                      <span>{topic.title}</span>
                    )}
                    <span className="topic-status">{topic.lessonId ? "Disponível" : "Em desenvolvimento"}</span>
                  </div>
                  {topic.lessonId && <ArrowRight size={19} aria-hidden="true" />}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
