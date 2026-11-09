import type { ReactNode } from "react";

export function PageIntro({
  category,
  title,
  children,
}: {
  category: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <header className="page-intro">
      <p className="eyebrow"><span className="indicator" />{category}</p>
      <h1>{title}</h1>
      <p className="page-intro-description">{children}</p>
    </header>
  );
}
