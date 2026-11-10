import type { Page, Route } from "@playwright/test";
import { lessons } from "../../src/data";
import { getLessonSteps, guidedLessonHref } from "../../src/lib/lesson-steps";
import { getStepNarrationClips } from "../../src/lib/narration-catalog";

const aula = lessons.find(({ id }) => id === "mecanica-respiratoria")!;
export const etapaDeTeste = getLessonSteps(aula)[0];
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

export async function servirNarracaoDeTeste(page: Page, { falharArquivo = false, incluirInterface = false } = {}) {
  const ids = clipesDaEtapa.map(({ id }) => id);
  if (incluirInterface) ids.push("interface/comando-desconhecido", "interface/ajuda-comando");
  const clips = Object.fromEntries(ids.map((id) => [id, Object.fromEntries(vozes.map(({ id: voz }) => [
    voz, { src: arquivoDeTeste(id, voz) },
  ]))]));

  await page.route("**/audio/manifest.json", (route) => route.fulfill({ json: { version: 1, voices: vozes, clips } }));
  await page.route(/\/audio\/teste-narracao\/.+\.mp3$/u, (route) => {
    if (falharArquivo) return route.fulfill({ status: 404 });
    return entregarMp3(route, route.request().url().includes("/interface/") ? mp3DaInterface : mp3DaEtapa);
  });
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
