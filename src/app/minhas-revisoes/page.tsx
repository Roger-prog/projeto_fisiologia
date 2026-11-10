import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { ReviewDashboard } from "@/components/study/review-dashboard";
import { lessons } from "@/data";
import { getReviewItems } from "@/data/review-items";

export const metadata: Metadata = { title: "Minhas Revisões" };

export default function MyReviewsPage() {
  return (
    <div className="site-shell inner-page">
      <PageIntro category="Prática" title="Minhas Revisões">
        Recupere de memória os conceitos estudados. Ao registrar como foi a lembrança, você programa a próxima revisão.
      </PageIntro>
      <ReviewDashboard items={getReviewItems(lessons)} />
    </div>
  );
}
