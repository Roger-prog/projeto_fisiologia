import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { QuickReview } from "@/components/study/quick-review";
import { ClearProgress } from "@/components/study/study-provider";
import { lessons } from "@/data";

export const metadata: Metadata = { title: "Revisão rápida" };

export default function ReviewPage() {
  return (
    <div className="site-shell inner-page">
      <PageIntro category="Prática" title="Revisão rápida">
        Tente responder de memória antes de revelar a resposta. Você pode revisar as perguntas quantas vezes quiser.
      </PageIntro>
      <Link className="button button-primary review-dashboard-link" href="/minhas-revisoes/">
        Abrir Minhas Revisões
      </Link>

      <div className="review-grid">
        {lessons.map((lesson) => (
          <QuickReview
            key={lesson.id}
            id={`revisao-${lesson.id}`}
            title={lesson.title}
            lessonId={lesson.id}
            summary={lesson.summary}
            items={lesson.quickReview}
          />
        ))}
      </div>

      <section className="study-panel progress-panel" aria-labelledby="seu-progresso">
        <h2 id="seu-progresso">Seu progresso</h2>
        <p>As etapas concluídas, as respostas e as revisões ficam salvas neste navegador. Você pode apagar esse histórico a qualquer momento.</p>
        <ClearProgress />
      </section>
    </div>
  );
}
