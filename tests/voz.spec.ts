import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { lessons } from "../src/data";
import {
  arquivoDeTeste,
  clipesDaEtapa,
  concluirFaixaNativa,
  lerReproducaoNativa,
  monitorarReproducaoNativa,
  rotaDaEtapa,
  servirManifestoSemClipes,
  servirNarracaoDeTeste,
  vozPrincipal,
} from "./fixtures/narracao";

type ResultadoSimulado = { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] };
type EstadoSimulado = {
  escutando: boolean;
  narrando: boolean;
  narracaoPausada: boolean;
  inicios: { idioma: string; continua: boolean; parciais: boolean; alternativas: number }[];
  instantesDeInicio: number[];
  falas: { idioma: string; texto: string }[];
  sobreposicoes: string[];
};
type VozSimulada = {
  estado: () => EstadoSimulado;
  dizer: (texto: string, final?: boolean, atrasado?: boolean) => void;
  falhar: (codigo: string) => void;
  encerrarReconhecimento: () => void;
  revogarPermissao: () => void;
  concluirTrecho: () => boolean;
};

type OpcoesDeVoz = {
  modo?: "disponivel" | "negado" | "indisponivel";
  atrasoDeFimAposAbortar?: number | null;
  recusarSegundoInicio?: boolean;
  bloquearInicioDeAudio?: boolean;
  manterManifesto?: boolean;
};

async function simularAPIsDeVoz(page: Page, opcoes: OpcoesDeVoz = {}) {
  if (!opcoes.manterManifesto) await servirManifestoSemClipes(page);
  await page.addInitScript(({ modo, atrasoDeFimAposAbortar = 0, recusarSegundoInicio, bloquearInicioDeAudio }) => {
    Object.defineProperty(window, "SpeechRecognition", { value: undefined, configurable: true });
    Object.defineProperty(window, "webkitSpeechRecognition", { value: undefined, configurable: true });
    if (modo === "indisponivel") return;

    let atual: Reconhecimento | null = null;
    let liberando: Reconhecimento | null = null;
    let falaAtual: SpeechSynthesisUtterance | null = null;
    let narracaoPausada = false;
    let entregarResultadoAnterior: Reconhecimento["onresult"] = null;
    const inicios: EstadoSimulado["inicios"] = [];
    const instantesDeInicio: number[] = [];
    const falas: EstadoSimulado["falas"] = [];
    const sobreposicoes: string[] = [];
    function faixaEmReproducao() {
      const midias = Reflect.get(window, "midiasDeTeste") as Set<HTMLMediaElement> | undefined;
      return midias && [...midias].some((midia) => !midia.paused && !midia.ended);
    }
    const permissao = Object.assign(new EventTarget(), {
      state: "granted" as PermissionState,
      onchange: null as ((evento: Event) => void) | null,
    });
    const consultarPermissao = navigator.permissions.query.bind(navigator.permissions);
    Object.defineProperty(navigator.permissions, "query", {
      value: (descritor: PermissionDescriptor) => descritor.name === "microphone"
        ? Promise.resolve(permissao)
        : consultarPermissao(descritor),
    });

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
        inicios.push({ idioma: this.lang, continua: this.continuous, parciais: this.interimResults, alternativas: this.maxAlternatives });
        instantesDeInicio.push(Date.now());
        if (atual || liberando || falaAtual || faixaEmReproducao()) {
          sobreposicoes.push("Escuta iniciada com outra operação de voz em andamento.");
          throw new DOMException("Operação de voz ainda em andamento.", "InvalidStateError");
        }
        if (recusarSegundoInicio && inicios.length === 2) {
          throw new DOMException("Novo gesto exigido pelo navegador simulado.", "NotAllowedError");
        }
        atual = this;
        entregarResultadoAnterior = this.onresult;
        queueMicrotask(() => {
          if (atual !== this) return;
          if (modo === "negado") {
            this.falhar("not-allowed");
          } else {
            this.onstart?.();
          }
        });
      }

      terminar(atraso: number | null = 0) {
        if (atual !== this) return;
        atual = null;
        liberando = this;
        const informarFim = () => {
          if (liberando === this) liberando = null;
          this.onend?.();
        };
        if (atraso === null) return;
        if (atraso === 0) queueMicrotask(informarFim);
        else setTimeout(informarFim, atraso);
      }

      abort() {
        this.terminar(atrasoDeFimAposAbortar);
      }

      falhar(codigo: string) {
        if (atual !== this) return;
        this.terminar();
        this.onerror?.({ error: codigo });
      }
    }

    Object.defineProperty(window, modo === "negado" ? "SpeechRecognition" : "webkitSpeechRecognition", {
      value: Reconhecimento, configurable: true,
    });
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        getVoices: () => [],
        get paused() { return narracaoPausada; },
        speak(fala: SpeechSynthesisUtterance) {
          if (atual) sobreposicoes.push("Narração iniciada durante escuta.");
          if (faixaEmReproducao()) sobreposicoes.push("Síntese iniciada durante outra narração.");
          falaAtual = fala;
          falas.push({ idioma: fala.lang, texto: fala.text });
          if (!bloquearInicioDeAudio) {
            queueMicrotask(() => {
              if (falaAtual === fala) fala.dispatchEvent(new Event("start"));
            });
          }
        },
        pause() { narracaoPausada = true; },
        resume() { narracaoPausada = false; },
        cancel() { falaAtual = null; },
      },
    });

    const voz: VozSimulada = {
      estado: () => ({ escutando: Boolean(atual), narrando: Boolean(falaAtual), narracaoPausada, inicios, instantesDeInicio, falas, sobreposicoes }),
      dizer(texto, final = true, atrasado = false) {
        const reconhecimento = atual;
        const entregar = atrasado ? entregarResultadoAnterior : reconhecimento?.onresult;
        if (!entregar) throw new Error("O teste tentou falar sem uma escuta ativa.");
        entregar({ resultIndex: 0, results: [{ isFinal: final, 0: { transcript: texto } }] });
        if (final && !atrasado && !reconhecimento?.continuous) reconhecimento?.terminar();
      },
      falhar(codigo) {
        if (!atual) throw new Error("O teste tentou interromper uma escuta inativa.");
        atual.falhar(codigo);
      },
      encerrarReconhecimento() {
        if (!atual) throw new Error("O teste tentou encerrar uma escuta inativa.");
        atual.terminar();
      },
      revogarPermissao() {
        permissao.state = "denied";
        const evento = new Event("change");
        permissao.dispatchEvent(evento);
        permissao.onchange?.(evento);
      },
      concluirTrecho() {
        if (!falaAtual || narracaoPausada) return false;
        const anterior = falaAtual;
        falaAtual = null;
        anterior.dispatchEvent(new Event("end"));
        return true;
      },
    };
    Reflect.set(window, "vozSimulada", voz);
  }, opcoes);
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

function encerrarReconhecimento(page: Page) {
  return page.evaluate(() => (Reflect.get(window, "vozSimulada") as VozSimulada).encerrarReconhecimento());
}

function simularVisibilidade(page: Page, oculta: boolean) {
  return page.evaluate((oculta) => {
    Object.defineProperties(document, {
      hidden: { configurable: true, value: oculta },
      visibilityState: { configurable: true, value: oculta ? "hidden" : "visible" },
    });
    document.dispatchEvent(new Event("visibilitychange"));
  }, oculta);
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
  const iniciosAntes = (await estado(page)).inicios.length;
  await dizer(page, frase);
  await expect.poll(async () => {
    const atual = await estado(page);
    return atual.narrando || (atual.escutando && atual.inicios.length > iniciosAntes);
  }).toBe(true);
  await concluirNarracao(page);
  await esperarEscuta(page);
}

function respostaSalva(page: Page, aulaId: string, perguntaId: string) {
  return page.evaluate(({ aulaId, perguntaId }) => {
    const dados = JSON.parse(localStorage.getItem("fisioacessivel:study:v1") ?? "{}");
    return (dados.progress?.lessons?.[aulaId]?.responses?.[perguntaId]?.optionId ?? null) as string | null;
  }, { aulaId, perguntaId });
}

test("executa dez comandos com uma ativação, retomando etapas e navegando entre páginas", async ({ page }) => {
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
  await concluirNarracao(page);
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
  expect((await estado(page)).inicios.length).toBeGreaterThanOrEqual(11);

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

test("mantém a sessão após dois minutos de silêncio e além de dez minutos", async ({ page }) => {
  await page.clock.install();
  await simularAPIsDeVoz(page);
  await page.goto("/");
  await ativar(page).press("Enter");
  await esperarEscuta(page);

  for (let ocorrencia = 0; ocorrencia < 4; ocorrencia += 1) {
    await page.clock.fastForward(30_000);
    await esperarEscuta(page);
    await falhar(page, "no-speech");
    await page.clock.runFor(5_000);
    await esperarEscuta(page);
  }
  const instantes = (await estado(page)).instantesDeInicio;
  expect(instantes.at(-1)! - instantes[0]).toBeGreaterThanOrEqual(120_000);

  await page.clock.fastForward("11:00");
  await executarComando(page, "Listar aulas");
  await expect(feedback(page)).toContainText("Aulas disponíveis");

  await page.getByRole("button", { name: "Encerrar interação por voz", exact: true }).press("Enter");
  await expect(painel(page)).toHaveAttribute("data-voice-state", "inactive");
  const iniciosAoEncerrar = (await estado(page)).inicios.length;
  await page.clock.fastForward(30_000);
  expect((await estado(page)).inicios).toHaveLength(iniciosAoEncerrar);
  expect((await estado(page)).escutando).toBe(false);
});

test("explica a negativa de permissão e mantém a navegação convencional", async ({ page }) => {
  await page.clock.install();
  await simularAPIsDeVoz(page, { modo: "negado" });
  await page.goto("/");
  await ativar(page).press("Enter");
  await expect(painel(page)).toHaveAttribute("data-voice-state", "error");
  await expect(painel(page)).toContainText("O navegador não autorizou o microfone");
  await page.clock.fastForward(30_000);
  expect((await estado(page)).inicios).toHaveLength(1);
  expect((await estado(page)).escutando).toBe(false);

  await page.getByRole("link", { name: "Começar a estudar", exact: true }).press("Enter");
  await expect(page).toHaveURL("/modulos/");
});

test("suspende ao ocultar a página, retoma ao voltar e encerra se a permissão é revogada", async ({ page }) => {
  await page.clock.install();
  await simularAPIsDeVoz(page);
  await page.goto("/aulas/mecanica-respiratoria/guiado/inspiracao/");
  await ativar(page).press("Enter");
  await esperarEscuta(page);
  await dizer(page, "Ouvir a etapa");
  await expect(painel(page)).toHaveAttribute("data-voice-state", "narrating");

  await simularVisibilidade(page, true);
  await expect(painel(page)).toHaveAttribute("data-voice-state", "suspended");
  const iniciosAntesDeVoltar = (await estado(page)).inicios.length;
  await page.clock.fastForward(30_000);
  expect((await estado(page)).inicios).toHaveLength(iniciosAntesDeVoltar);
  expect((await estado(page)).escutando).toBe(false);
  expect((await estado(page)).narrando).toBe(false);

  await simularVisibilidade(page, false);
  await esperarEscuta(page);
  expect((await estado(page)).inicios).toHaveLength(iniciosAntesDeVoltar + 1);
  await page.evaluate(() => (Reflect.get(window, "vozSimulada") as VozSimulada).revogarPermissao());
  await expect(painel(page)).toHaveAttribute("data-voice-state", "error");
  const iniciosAntesDaRevogacao = (await estado(page)).inicios.length;
  await page.clock.fastForward(30_000);
  expect((await estado(page)).inicios).toHaveLength(iniciosAntesDaRevogacao);
  expect((await estado(page)).escutando).toBe(false);
});

test("recupera fim inesperado e falha de rede com intervalos progressivos e limite", async ({ page }) => {
  await page.clock.install();
  await simularAPIsDeVoz(page);
  await page.goto("/");
  await ativar(page).press("Enter");
  await esperarEscuta(page);

  const atrasos = [500, 1_000, 2_000, 4_000];
  for (const [indice, atraso] of atrasos.entries()) {
    const instanteDaFalha = await page.evaluate(() => Date.now());
    if (indice === 0) await encerrarReconhecimento(page);
    else await falhar(page, "network");
    await expect(painel(page)).toHaveAttribute("data-voice-state", "recovering");
    await page.clock.runFor(atraso + 200);
    await esperarEscuta(page);
    expect((await estado(page)).instantesDeInicio.at(-1)! - instanteDaFalha).toBeGreaterThanOrEqual(atraso);
  }

  await falhar(page, "network");
  await expect(painel(page)).toHaveAttribute("data-voice-state", "error");
  await expect(ativar(page)).toBeEnabled();
  await page.clock.fastForward(30_000);
  const final = await estado(page);
  expect(final.inicios).toHaveLength(5);
  expect(final.sobreposicoes).toEqual([]);
});

test("aguarda o evento nativo de liberação antes de responder ou reiniciar", async ({ page }) => {
  await page.clock.install();
  await simularAPIsDeVoz(page, { atrasoDeFimAposAbortar: 1_500 });
  await page.goto("/");
  await ativar(page).press("Enter");
  await esperarEscuta(page);

  await dizer(page, "Listar aulas");
  await page.clock.runFor(750);
  const aguardando = await estado(page);
  expect(aguardando.escutando).toBe(false);
  expect(aguardando.falas).toEqual([]);
  expect(aguardando.inicios).toHaveLength(1);

  await page.clock.runFor(1_000);
  await expect(painel(page)).toHaveAttribute("data-voice-state", "narrating");
  expect((await estado(page)).inicios).toHaveLength(1);
  await concluirNarracao(page);
  await page.clock.runFor(500);
  await esperarEscuta(page);
  expect((await estado(page)).sobreposicoes).toEqual([]);
});

test("não inicia outra escuta se o navegador não confirmar a liberação", async ({ page }) => {
  await page.clock.install();
  await simularAPIsDeVoz(page, { atrasoDeFimAposAbortar: null });
  await page.goto("/");
  await ativar(page).press("Enter");
  await esperarEscuta(page);

  await dizer(page, "Listar aulas");
  await page.clock.runFor(6_000);
  await expect(painel(page)).toHaveAttribute("data-voice-state", "error");
  await expect(painel(page)).toContainText("não confirmou a liberação do microfone");
  await page.clock.fastForward(30_000);
  const final = await estado(page);
  expect(final.inicios).toHaveLength(1);
  expect(final.falas).toEqual([]);
  expect(final.sobreposicoes).toEqual([]);
});

test("permite nova ativação quando o navegador exige outro gesto", async ({ page }) => {
  await page.clock.install();
  await simularAPIsDeVoz(page, { recusarSegundoInicio: true });
  await page.goto("/");
  await ativar(page).press("Enter");
  await esperarEscuta(page);

  await dizer(page, "Listar aulas");
  await expect(painel(page)).toHaveAttribute("data-voice-state", "narrating");
  await concluirNarracao(page);
  await expect(painel(page)).toHaveAttribute("data-voice-state", "error");
  await expect(painel(page)).toContainText("Nova ativação necessária");
  await page.clock.fastForward(30_000);
  expect((await estado(page)).inicios).toHaveLength(2);

  await ativar(page).press("Enter");
  await esperarEscuta(page);
  expect((await estado(page)).inicios).toHaveLength(3);
});

test("mantém o microfone suspenso durante a leitura e durante uma pausa no player", async ({ page }) => {
  await page.clock.install();
  await simularAPIsDeVoz(page);
  await page.goto("/aulas/mecanica-respiratoria/guiado/inspiracao/");
  await ativar(page).press("Enter");
  await esperarEscuta(page);
  const player = page.getByRole("region", { name: "Leitura da etapa em voz alta" });

  await player.getByRole("button", { name: "Ouvir a etapa", exact: true }).press("Enter");
  await expect(painel(page)).toHaveAttribute("data-voice-state", "narrating");
  await player.getByRole("button", { name: "Pausar", exact: true }).press("Enter");
  await expect.poll(async () => (await estado(page)).narracaoPausada).toBe(true);
  await page.clock.fastForward(30_000);
  expect((await estado(page)).escutando).toBe(false);
  expect((await estado(page)).inicios).toHaveLength(1);

  await player.getByRole("button", { name: "Continuar", exact: true }).press("Enter");
  await concluirNarracao(page);
  await esperarEscuta(page);
  expect((await estado(page)).sobreposicoes).toEqual([]);
});

test("coordena arquivos da aula e da interface, síntese dinâmica e retomada do microfone", async ({ page }) => {
  await simularAPIsDeVoz(page, { manterManifesto: true });
  await servirNarracaoDeTeste(page, { incluirInterface: true });
  await monitorarReproducaoNativa(page);
  await page.goto(rotaDaEtapa);
  await expect(page.getByLabel("Voz da narração", { exact: true })).toHaveValue(vozPrincipal);
  await ativar(page).press("Enter");
  await esperarEscuta(page);

  async function faixaTocando(caminho: string) {
    await expect.poll(async () => {
      const faixa = (await lerReproducaoNativa(page)).find(({ tocando, duracao }) => tocando && duracao > 0);
      return faixa?.caminho;
    }).toBe(caminho);
  }

  await dizer(page, "Ouvir a etapa");
  await faixaTocando(arquivoDeTeste(clipesDaEtapa[0].id));
  await expect(painel(page)).toHaveAttribute("data-voice-state", "narrating");
  expect(await estado(page)).toMatchObject({ escutando: false, narrando: false, falas: [] });

  await page.getByRole("button", { name: "Ouvir minhas opções", exact: true }).press("Enter");
  await expect.poll(async () => (await estado(page)).narrando).toBe(true);
  expect((await lerReproducaoNativa(page)).some(({ tocando }) => tocando)).toBe(false);
  expect((await estado(page)).escutando).toBe(false);
  await concluirNarracao(page);
  await esperarEscuta(page);

  const falasAntes = (await estado(page)).falas.length;
  await dizer(page, "frase sem correspondência no catálogo de comandos");
  await faixaTocando(arquivoDeTeste("interface/comando-desconhecido"));
  await expect(feedback(page)).toContainText("Comando não reconhecido");
  expect((await estado(page)).escutando).toBe(false);
  await concluirFaixaNativa(page);
  await faixaTocando(arquivoDeTeste("interface/ajuda-comando"));
  expect((await estado(page)).escutando).toBe(false);
  await concluirFaixaNativa(page);
  await esperarEscuta(page);

  const final = await estado(page);
  expect(final.falas).toHaveLength(falasAntes);
  expect(final.sobreposicoes).toEqual([]);
});

test("retoma a escuta e preserva o feedback em texto quando a narração não inicia", async ({ page }) => {
  await page.clock.install();
  await simularAPIsDeVoz(page, { bloquearInicioDeAudio: true });
  await page.goto("/");
  await ativar(page).press("Enter");
  await esperarEscuta(page);

  await dizer(page, "Listar aulas");
  await expect(painel(page)).toHaveAttribute("data-voice-state", "narrating");
  await page.clock.runFor(9_000);
  await esperarEscuta(page);
  await expect(feedback(page)).toContainText("Aulas disponíveis");
  expect((await estado(page)).narrando).toBe(false);
  expect((await estado(page)).sobreposicoes).toEqual([]);
});

test("oferece atalho de teclado, lembra a preferência e mantém o diagnóstico sem transcrição", async ({ page }) => {
  await page.clock.install();
  await simularAPIsDeVoz(page);
  await page.goto("/");
  await expect(page.locator("[data-voice-diagnostics]")).toHaveCount(0);
  await page.goto("/?diagnostico-voz=1");
  await expect(ativar(page)).toBeEnabled();

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const atalho = page.getByRole("link", { name: "Ir para a interação por voz", exact: true });
  await expect(atalho).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(painel(page)).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(ativar(page)).toBeFocused();

  const preferencia = page.getByRole("checkbox", { name: "Lembrar preferência por interação por voz", exact: true });
  await preferencia.press("Space");
  await expect(preferencia).toBeChecked();
  expect((await estado(page)).inicios).toEqual([]);

  await ativar(page).press("Enter");
  const frasePrivada = "frase simulada privada que não deve ir para o diagnóstico";
  await executarComando(page, frasePrivada);
  const diagnostico = page.locator("[data-voice-diagnostics]");
  await diagnostico.locator("summary").press("Enter");
  await expect(diagnostico.locator('[data-voice-event*="result"]')).toBeVisible();
  await expect(diagnostico).not.toContainText(frasePrivada);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(frasePrivada);

  await page.reload();
  await expect(preferencia).toBeChecked();
  await expect(ativar(page)).toBeEnabled();
  await page.clock.fastForward(30_000);
  await expect(painel(page)).toHaveAttribute("data-voice-state", "inactive");
  expect((await estado(page)).inicios).toEqual([]);
});

test("usa os controles convencionais quando não há API de reconhecimento", async ({ page }) => {
  await simularAPIsDeVoz(page, { modo: "indisponivel" });
  await page.goto("/");
  await expect(painel(page)).toHaveAttribute("data-voice-state", "unavailable");
  await expect(painel(page)).toContainText("O reconhecimento de voz está indisponível neste navegador");
  await expect(ativar(page)).toBeDisabled();
  await page.getByRole("link", { name: "Começar a estudar", exact: true }).press("Enter");
  await expect(page).toHaveURL("/modulos/");
});
