import { expect, type Page, type Route } from "@playwright/test";
import { lessons } from "../../src/data";
import { getLessonSteps, guidedLessonHref } from "../../src/lib/lesson-steps";
import { getNarrationCatalog, getStepNarrationClips } from "../../src/lib/narration-catalog";

const aula = lessons.find(({ id }) => id === "mecanica-respiratoria")!;
export const etapaDeTeste = getLessonSteps(aula).find(({ id }) => id === "pressoes")!;
export const rotaDaEtapa = guidedLessonHref(aula.id, etapaDeTeste.id);
export const clipesDaEtapa = getStepNarrationClips(aula, etapaDeTeste);
export const vozPrincipal = "voz-teste-principal";
export const vozAlternativa = "voz-teste-alternativa";
const vozes = [
  { id: vozPrincipal, label: "Voz de teste principal", language: "pt-BR", kind: "neural" },
  { id: vozAlternativa, label: "Voz de teste alternativa", language: "pt-BR", kind: "neural" },
];

export function arquivoDeTeste(clipId: string, voz = vozPrincipal) {
  return `/audio/teste-narracao/${clipId}-${voz}.mp3`;
}

function gerarMp3Silencioso(quadros: number) {
  // Quadros MPEG-1 Layer III mono a 44,1 kHz e 32 kb/s, com dados de áudio zerados.
  const quadro = Buffer.alloc(104);
  quadro.set([0xff, 0xfb, 0x10, 0xc0]);
  return Buffer.concat(Array.from({ length: quadros }, () => quadro));
}

const mp3DaEtapa = gerarMp3Silencioso(384);
const mp3DaInterface = gerarMp3Silencioso(64);

function entregarMp3(route: Route, body: Buffer) {
  const headers = { "accept-ranges": "bytes", "content-type": "audio/mpeg" };
  if (route.request().method() === "HEAD") {
    return route.fulfill({ status: 200, headers: { ...headers, "content-length": String(body.length) } });
  }
  const faixa = /^bytes=(\d+)-(\d*)$/u.exec(route.request().headers().range ?? "");
  if (!faixa) return route.fulfill({ status: 200, headers, body });
  const inicio = Number(faixa[1]);
  const fim = faixa[2] ? Math.min(Number(faixa[2]), body.length - 1) : body.length - 1;
  if (inicio > fim) {
    return route.fulfill({ status: 416, headers: { ...headers, "content-range": `bytes */${body.length}` } });
  }
  return route.fulfill({
    status: 206,
    headers: { ...headers, "content-range": `bytes ${inicio}-${fim}/${body.length}` },
    body: body.subarray(inicio, fim + 1),
  });
}

type RequisicaoDeAudio = { caminho: string; metodo: string };
type OpcoesDeNarracao = {
  catalogoCompleto?: boolean;
  faixasCurtas?: boolean;
  falha?: (requisicao: RequisicaoDeAudio) => number | undefined;
};

export async function servirNarracaoDeTeste(page: Page, {
  catalogoCompleto = false, faixasCurtas = false, falha,
}: OpcoesDeNarracao = {}) {
  const catalogo = catalogoCompleto ? getNarrationCatalog() : clipesDaEtapa;
  const ids = catalogo.map(({ id }) => id);
  const clips = Object.fromEntries(ids.map((id) => [id, Object.fromEntries(vozes.map(({ id: voz }) => [
    voz, { src: arquivoDeTeste(id, voz) },
  ]))]));
  const requisicoes: (RequisicaoDeAudio & { status: number })[] = [];

  await page.route("**/audio/manifest.json", (route) => route.fulfill({ json: { version: 1, voices: vozes, clips } }));
  await page.route(/\/audio\/teste-narracao\/.+\.mp3$/u, (route) => {
    const requisicao = { caminho: new URL(route.request().url()).pathname, metodo: route.request().method() };
    const status = falha?.(requisicao);
    requisicoes.push({ ...requisicao, status: status ?? 200 });
    if (status) return route.fulfill({ status });
    return entregarMp3(route, faixasCurtas || requisicao.caminho.includes("/interface/") ? mp3DaInterface : mp3DaEtapa);
  });
  return requisicoes;
}

export function servirManifestoSemClipes(page: Page) {
  return page.route("**/audio/manifest.json", (route) => route.fulfill({ json: { version: 1, voices: [], clips: {} } }));
}

export async function monitorarReproducaoNativa(page: Page) {
  await page.addInitScript(() => {
    const midias = new Set<HTMLMediaElement>();
    Reflect.set(window, "midiasDeTeste", midias);
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      midias.add(this);
      return play.call(this);
    };
  });
}

export function lerReproducaoNativa(page: Page) {
  return page.evaluate(() => {
    const midias = Reflect.get(window, "midiasDeTeste") as Set<HTMLMediaElement>;
    return [...midias].map((midia) => ({
      tocando: !midia.paused && !midia.ended,
      tempo: midia.currentTime,
      duracao: midia.duration,
      velocidade: midia.playbackRate,
      caminho: midia.currentSrc ? new URL(midia.currentSrc).pathname : "",
    }));
  });
}

export function concluirFaixaNativa(page: Page) {
  return page.evaluate(() => {
    const midias = Reflect.get(window, "midiasDeTeste") as Set<HTMLMediaElement>;
    const ativa = [...midias].find((midia) => !midia.paused && Number.isFinite(midia.duration));
    if (!ativa) throw new Error("Nenhuma faixa nativa em reprodução.");
    ativa.currentTime = Math.max(0, ativa.duration - 0.03);
  });
}

export async function aguardarFaixaNativa(page: Page, caminho: string) {
  await expect.poll(async () => {
    const faixa = (await lerReproducaoNativa(page)).find(({ tocando, duracao }) => tocando && duracao > 0);
    return faixa?.caminho;
  }).toBe(caminho);
}

export async function monitorarSinteseDoNavegador(page: Page) {
  await page.addInitScript(() => {
    const chamadas: { idioma: string; velocidade: number; texto: string }[] = [];
    let falaAtual: SpeechSynthesisUtterance | null = null;
    Reflect.set(window, "sinteseDoNavegador", chamadas);
    Reflect.set(window, "concluirTrechoDeSintese", () => {
      if (!falaAtual) return false;
      const fala = falaAtual;
      falaAtual = null;
      fala.dispatchEvent(new Event("end"));
      return true;
    });
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        getVoices: () => [],
        speak(fala: SpeechSynthesisUtterance) {
          falaAtual = fala;
          chamadas.push({ idioma: fala.lang, velocidade: fala.rate, texto: fala.text });
          queueMicrotask(() => { if (falaAtual === fala) fala.dispatchEvent(new Event("start")); });
        },
        cancel() { falaAtual = null; },
      },
    });
  });
}

export function lerSinteseDoNavegador(page: Page) {
  return page.evaluate(() => Reflect.get(window, "sinteseDoNavegador") as {
    idioma: string; velocidade: number; texto: string;
  }[]);
}

export function concluirSinteseDoNavegador(page: Page) {
  return page.evaluate(() => {
    const concluir = Reflect.get(window, "concluirTrechoDeSintese") as () => boolean;
    let trechos = 0;
    while (trechos < 100 && concluir()) trechos += 1;
  });
}
