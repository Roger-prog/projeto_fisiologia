import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { lessons } from "../src/data";

type ResultadoSimulado = { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] };
type EstadoSimulado = {
  escutando: boolean;
  narrando: boolean;
  inicios: { idioma: string; continua: boolean; parciais: boolean; alternativas: number }[];
  falas: { idioma: string; texto: string }[];
  sobreposicoes: string[];
};
type VozSimulada = {
  estado: () => EstadoSimulado;
  dizer: (texto: string, final?: boolean, atrasado?: boolean) => void;
  falhar: (codigo: string) => void;
  concluirTrecho: () => boolean;
};

async function simularAPIsDeVoz(page: Page, modo: "disponivel" | "negado" | "indisponivel" = "disponivel") {
  await page.addInitScript((modo) => {
    Object.defineProperty(window, "SpeechRecognition", { value: undefined, configurable: true });
    Object.defineProperty(window, "webkitSpeechRecognition", { value: undefined, configurable: true });
    if (modo === "indisponivel") return;

    let atual: Reconhecimento | null = null;
    let falaAtual: SpeechSynthesisUtterance | null = null;
    let entregarResultadoAnterior: Reconhecimento["onresult"] = null;
    const inicios: EstadoSimulado["inicios"] = [];
    const falas: EstadoSimulado["falas"] = [];
    const sobreposicoes: string[] = [];

    class Reconhecimento {
      lang = "";
      continuous = false;
      interimResults = false;
      maxAlternatives = 0;
      onstart: (() => void) | null = null;
      onresult: ((evento: ResultadoSimulado) => void) | null = null;
      onnomatch: (() => void) | null = null;
      onerror: ((evento: { error: string }) => void) | null = null;
      onend: (() => void) | null = null;

      start() {
        if (atual || falaAtual) sobreposicoes.push("Escuta iniciada com outra operação de voz em andamento.");
        atual = this;
        entregarResultadoAnterior = this.onresult;
        inicios.push({ idioma: this.lang, continua: this.continuous, parciais: this.interimResults, alternativas: this.maxAlternatives });
        queueMicrotask(() => {
          if (atual !== this) return;
          if (modo === "negado") {
            this.falhar("not-allowed");
          } else {
            this.onstart?.();
          }
        });
      }

      abort() {
        if (atual !== this) return;
        atual = null;
        queueMicrotask(() => this.onend?.());
      }

      falhar(codigo: string) {
        if (atual !== this) return;
        atual = null;
        this.onerror?.({ error: codigo });
        queueMicrotask(() => this.onend?.());
      }
    }

    Object.defineProperty(window, modo === "negado" ? "SpeechRecognition" : "webkitSpeechRecognition", {
      value: Reconhecimento, configurable: true,
    });
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        getVoices: () => [],
        speak(fala: SpeechSynthesisUtterance) {
          if (atual) sobreposicoes.push("Narração iniciada durante escuta.");
          falaAtual = fala;
          falas.push({ idioma: fala.lang, texto: fala.text });
        },
        cancel() { falaAtual = null; },
      },
    });

    const voz: VozSimulada = {
      estado: () => ({ escutando: Boolean(atual), narrando: Boolean(falaAtual), inicios, falas, sobreposicoes }),
      dizer(texto, final = true, atrasado = false) {
        const reconhecimento = atual;
        const entregar = atrasado ? entregarResultadoAnterior : reconhecimento?.onresult;
        if (!entregar) throw new Error("O teste tentou falar sem uma escuta ativa.");
        entregar({ resultIndex: 0, results: [{ isFinal: final, 0: { transcript: texto } }] });
        if (final && !atrasado && !reconhecimento?.continuous) reconhecimento?.abort();
      },
      falhar(codigo) {
        if (!atual) throw new Error("O teste tentou interromper uma escuta inativa.");
        atual.falhar(codigo);
      },
      concluirTrecho() {
        if (!falaAtual) return false;
        const anterior = falaAtual;
        falaAtual = null;
        anterior.dispatchEvent(new Event("end"));
        return true;
      },
    };
    Reflect.set(window, "vozSimulada", voz);
  }, modo);
}

const painel = (page: Page) => page.locator("[data-voice-state]");
const feedback = (page: Page) => page.locator("[data-voice-feedback]");
const ativar = (page: Page) => page.getByRole("button", { name: "Ativar interação por voz", exact: true });

function estado(page: Page) {
  return page.evaluate(() => (Reflect.get(window, "vozSimulada") as VozSimulada).estado());
}

function dizer(page: Page, texto: string, final = true, atrasado = false) {
  return page.evaluate(({ texto, final, atrasado }) => {
    (Reflect.get(window, "vozSimulada") as VozSimulada).dizer(texto, final, atrasado);
  }, { texto, final, atrasado });
}

function falhar(page: Page, codigo: string) {
  return page.evaluate((erro) => (Reflect.get(window, "vozSimulada") as VozSimulada).falhar(erro), codigo);
}

function concluirNarracao(page: Page) {
  return page.evaluate(() => {
    const voz = Reflect.get(window, "vozSimulada") as VozSimulada;
    let trechos = 0;
    while (trechos < 50 && voz.concluirTrecho()) trechos += 1;
  });
}

async function esperarEscuta(page: Page) {
  await expect(painel(page)).toHaveAttribute("data-voice-state", "listening");
  await expect.poll(async () => (await estado(page)).escutando).toBe(true);
}

async function executarComando(page: Page, frase: string) {
  await esperarEscuta(page);
  await dizer(page, frase);
  await concluirNarracao(page);
  await esperarEscuta(page);
}

function respostaSalva(page: Page, aulaId: string, perguntaId: string) {
  return page.evaluate(({ aulaId, perguntaId }) => {
    const dados = JSON.parse(localStorage.getItem("fisioacessivel:study:v1") ?? "{}");
    return (dados.progress?.lessons?.[aulaId]?.responses?.[perguntaId]?.optionId ?? null) as string | null;
  }, { aulaId, perguntaId });
}

test("retoma e navega no modo guiado por voz, alternando escuta e narração", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await simularAPIsDeVoz(page);
  const respiratoria = "/aulas/mecanica-respiratoria/guiado/";
  await page.goto(`${respiratoria}inspiracao/`);
  await expect(page.getByRole("heading", { level: 1, name: /Na inspiração/ })).toBeFocused();
  await page.goto("/");
  await expect(ativar(page)).toBeEnabled();
  await expect(ativar(page)).toHaveAccessibleDescription(/usa o microfone.*pode enviar a fala.*não armazena/i);
  expect((await estado(page)).inicios).toEqual([]);

  await ativar(page).press("Enter");
  await esperarEscuta(page);
  expect((await estado(page)).inicios[0]).toEqual({ idioma: "pt-BR", continua: false, parciais: false, alternativas: 1 });
  await executarComando(page, "Preciso de ajuda");
  await expect(feedback(page)).toContainText("Diga");
  await executarComando(page, "Continuar de onde parei");
  await expect(page).toHaveURL(`${respiratoria}inspiracao/`);
  await executarComando(page, "Próxima");
  await expect(page).toHaveURL(`${respiratoria}expiracao/`);
  await executarComando(page, "Etapa anterior");
  await expect(page).toHaveURL(`${respiratoria}inspiracao/`);

  await dizer(page, "Ouvir a etapa");
  await expect(painel(page)).toHaveAttribute("data-voice-state", "narrating");
  await expect.poll(async () => (await estado(page)).narrando).toBe(true);
  expect((await estado(page)).escutando).toBe(false);
  await dizer(page, "Próxima etapa", true, true);
  await expect(page).toHaveURL(`${respiratoria}inspiracao/`);
  await page.getByRole("button", { name: "Parar áudio", exact: true }).press("Enter");
  await expect(feedback(page)).toContainText("Narração interrompida");
  await esperarEscuta(page);

  const falasAntes = (await estado(page)).falas.length;
  await executarComando(page, "Explicar novamente");
  expect((await estado(page)).falas.length).toBeGreaterThan(falasAntes);
  const player = page.getByRole("region", { name: "Leitura da etapa em voz alta" });
  await expect(player.getByText(/Trecho lido/)).toBeVisible();
  await executarComando(page, "Continuar a leitura");
  await expect(feedback(page)).toContainText("Lendo o trecho seguinte");
  await executarComando(page, "Parar leitura");
  await expect(player.getByText("Leitura interrompida.", { exact: true })).toBeVisible();
  await executarComando(page, "Abrir aula de Introdução ao Sistema Cardiovascular");
  await expect(page).toHaveURL("/aulas/introducao-ao-sistema-cardiovascular/guiado/introducao/");
  await executarComando(page, "Minhas Revisões");
  await expect(page).toHaveURL("/minhas-revisoes/");

  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(violations.map(({ id, nodes }) => ({ id, elementos: nodes.map(({ target }) => target) }))).toEqual([]);

  await dizer(page, "Encerrar sessão");
  await concluirNarracao(page);
  await expect(painel(page)).toHaveAttribute("data-voice-state", "inactive");
  const final = await estado(page);
  expect(final.escutando).toBe(false);
  expect(final.sobreposicoes).toEqual([]);
  expect(final.falas.every(({ idioma }) => idioma === "pt-BR")).toBe(true);
});

test("seleciona a alternativa falada e exige confirmação explícita para salvar", async ({ page }) => {
  const aula = lessons[0];
  const pergunta = aula.questions[0];
  await simularAPIsDeVoz(page);
  await page.goto(`/aulas/${aula.id}/guiado/introducao/`);
  await ativar(page).press("Enter");
  await executarComando(page, "Fazer exercícios");
  await expect(page).toHaveURL(`/aulas/${aula.id}/#exercicios`);

  const exercicios = page.getByRole("region", { name: "Exercícios de fixação" });
  const alternativaB = exercicios.getByRole("radio").nth(1);
  const antesDaPergunta = (await estado(page)).falas.length;
  await executarComando(page, "Ouvir pergunta");
  const perguntaNarrada = (await estado(page)).falas.slice(antesDaPergunta).map(({ texto }) => texto).join(" ");
  expect(perguntaNarrada).toContain(pergunta.prompt);
  expect(perguntaNarrada).toContain(`Alternativa B. ${pergunta.options[1].text}`);
  await executarComando(page, "Confirmar resposta");
  expect(await respostaSalva(page, aula.id, pergunta.id)).toBeNull();

  await dizer(page, "Letra B", false);
  await expect(alternativaB).not.toBeChecked();
  await executarComando(page, "Letra B");
  await expect(alternativaB).toBeChecked();
  await expect(feedback(page)).toContainText("Alternativa B selecionada");
  expect(await respostaSalva(page, aula.id, pergunta.id)).toBeNull();

  await executarComando(page, "Não confirmar resposta");
  await expect(feedback(page)).toContainText("Comando não reconhecido");
  expect(await respostaSalva(page, aula.id, pergunta.id)).toBeNull();

  await executarComando(page, "Confirmar a resposta");
  await expect(feedback(page)).toContainText("Resposta registrada");
  await expect(exercicios.locator(".quiz-feedback")).toBeVisible();
  expect(await respostaSalva(page, aula.id, pergunta.id)).toBe(pergunta.options[1].id);
  await executarComando(page, "Próxima pergunta");
  await expect(exercicios.getByText(aula.questions[1].prompt, { exact: true })).toBeVisible();
  expect((await estado(page)).sobreposicoes).toEqual([]);
});

test("encerra a escuta após duas ocorrências de silêncio e permite reativar", async ({ page }) => {
  await simularAPIsDeVoz(page);
  await page.goto("/");
  await ativar(page).press("Enter");
  await esperarEscuta(page);

  await falhar(page, "no-speech");
  await esperarEscuta(page);
  await expect(painel(page)).toContainText("Nenhuma fala foi detectada");
  await falhar(page, "no-speech");
  await expect(painel(page)).toHaveAttribute("data-voice-state", "inactive");
  await expect(painel(page)).toContainText("A sessão foi encerrada");
  expect((await estado(page)).escutando).toBe(false);

  await ativar(page).press("Enter");
  await esperarEscuta(page);
  await page.getByRole("button", { name: "Encerrar interação por voz", exact: true }).press("Enter");
  await expect(painel(page)).toHaveAttribute("data-voice-state", "inactive");
});

test("explica a negativa de permissão e mantém a navegação convencional", async ({ page }) => {
  await simularAPIsDeVoz(page, "negado");
  await page.goto("/");
  await ativar(page).press("Enter");
  await expect(painel(page)).toHaveAttribute("data-voice-state", "error");
  await expect(painel(page)).toContainText("O navegador não autorizou o microfone");
  expect((await estado(page)).escutando).toBe(false);

  await page.getByRole("link", { name: "Começar a estudar", exact: true }).press("Enter");
  await expect(page).toHaveURL("/modulos/");
});

test("suspende a sessão ao ocultar a página e informa a perda posterior de permissão", async ({ page }) => {
  await simularAPIsDeVoz(page);
  await page.goto("/aulas/mecanica-respiratoria/guiado/inspiracao/");
  await ativar(page).press("Enter");
  await esperarEscuta(page);
  await dizer(page, "Ouvir a etapa");
  await expect(painel(page)).toHaveAttribute("data-voice-state", "narrating");

  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(painel(page)).toHaveAttribute("data-voice-state", "inactive");
  await expect(painel(page)).toContainText("A sessão terminou ao ocultar a página");
  expect((await estado(page)).escutando).toBe(false);
  expect((await estado(page)).narrando).toBe(false);

  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(ativar(page)).toBeEnabled();
  await expect(painel(page)).toHaveAttribute("data-voice-state", "inactive");
  await ativar(page).press("Enter");
  await esperarEscuta(page);
  await falhar(page, "not-allowed");
  await expect(painel(page)).toHaveAttribute("data-voice-state", "error");
  await expect(painel(page)).toContainText("O navegador não autorizou o microfone");
  expect((await estado(page)).escutando).toBe(false);
});

test("usa os controles convencionais quando não há API de reconhecimento", async ({ page }) => {
  await simularAPIsDeVoz(page, "indisponivel");
  await page.goto("/");
  await expect(painel(page)).toHaveAttribute("data-voice-state", "unavailable");
  await expect(painel(page)).toContainText("O reconhecimento de voz está indisponível neste navegador");
  await expect(ativar(page)).toBeDisabled();
  await page.getByRole("link", { name: "Começar a estudar", exact: true }).press("Enter");
  await expect(page).toHaveURL("/modulos/");
});
