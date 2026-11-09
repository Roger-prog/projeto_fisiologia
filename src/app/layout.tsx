import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/manrope";
import "@fontsource-variable/inter";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { StudyProvider } from "@/components/study/study-provider";

export const metadata: Metadata = {
  title: { default: "FisioAcessível", template: "%s | FisioAcessível" },
  description: "Plataforma acessível de Fisiologia Humana para monitoria universitária.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <StudyProvider>
          <SiteHeader />
          <main id="conteudo" tabIndex={-1}>{children}</main>
          <SiteFooter />
        </StudyProvider>
      </body>
    </html>
  );
}
