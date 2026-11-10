import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/manrope";
import "@fontsource-variable/inter";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { StudyProvider } from "@/components/study/study-provider";
import { VoiceControls } from "@/components/voice/voice-controls";
import { VoiceProvider } from "@/components/voice/voice-provider";

export const metadata: Metadata = {
  title: { default: "FisioAcessível", template: "%s | FisioAcessível" },
  description: "Plataforma acessível de Fisiologia Humana para monitoria universitária.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <StudyProvider>
          <VoiceProvider>
            <SiteHeader />
            <VoiceControls />
            <main id="conteudo" tabIndex={-1}>{children}</main>
            <SiteFooter />
          </VoiceProvider>
        </StudyProvider>
      </body>
    </html>
  );
}
