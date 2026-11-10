# Narração com voz neural

As aulas **Introdução ao Sistema Cardiovascular** e **Mecânica Respiratória** têm gravações em português brasileiro, geradas por inteligência artificial com o modelo local Cadu do Piper. A voz serve de piloto para a revisão de pronúncia, ritmo e naturalidade. O texto científico continua disponível nos dois modos de estudo. [Ficha do modelo Cadu](https://huggingface.co/rhasspy/piper-voices/raw/main/pt/pt_BR/cadu/medium/MODEL_CARD) · [Licenciamento dos dados de voz](https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/COMMERCIAL_USE.md)

Escolha a voz e a velocidade em **Leitura em voz alta**. A voz escolhida acompanha a navegação na aba enquanto estiver disponível para o conteúdo. **Voltar ao começo** retorna ao início e aguarda uma nova ação para tocar. O andamento indica a fração dos trechos lidos. Se um arquivo falhar, **Usar voz do navegador** reinicia a leitura solicitada com a síntese do dispositivo. O navegador lista as vozes instaladas e a seleção automática dá prioridade a português do Brasil e a vozes identificadas como naturais ou aprimoradas.

Ao iniciar pelo botão do reprodutor, a etapa ou aula é reproduzida em sequência. Pelo microfone, o site lê um trecho por vez. A escuta é suspensa durante o áudio, inclusive com o player pausado. Entre trechos, use **Continuar leitura**, **Repetir** ou **Parar leitura**. Mensagens fixas têm faixas próprias. O site pode usar a voz do navegador para completar informações como o título da etapa e a explicação de uma questão. [Limites da interação por voz](interacao-por-voz.md)

## Gerar localmente com Piper

O build e a Vercel servem os MP3 e o manifesto já gerados em `public/audio/`. Python, Piper, o modelo e FFmpeg são usados apenas na geração. A versão do Cadu aceita pelo script deriva da base rdh. Mantenha o `.onnx` e o `.onnx.json` lado a lado, fora do repositório. [CLI do Piper](https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/CLI.md) · [Revisão do modelo usada no piloto](https://huggingface.co/rhasspy/piper-voices/tree/cf910fb59f1d79ab3b625a63993a108751c6c25d/pt/pt_BR/cadu/medium)

Em um ambiente Python isolado, instale `piper-tts==1.8.0` e execute `python -m piper.download_voices --download-dir CAMINHO pt_BR-cadu-medium`. Configure `FISIO_PIPER_MODEL` com o caminho absoluto do arquivo `pt_BR-cadu-medium.onnx`. Se necessário, configure `FISIO_PIPER_PYTHON` e `FISIO_FFMPEG` com os caminhos dos executáveis. Por padrão, o script usa `python` e `ffmpeg` do PATH. A geração do piloto usa mono a 22,05 kHz, 64 kb/s, pausas de 240 ms entre frases e normalização com alvo de −19 LUFS.

```powershell
npm run audio:generate -- --provider piper
npm run audio:generate -- --provider piper --generate
npm run audio:generate -- --verify
```

## Gerar com Google Cloud Chirp 3 HD

O provedor opcional usa uma voz Chirp 3 HD em português brasileiro e requer um projeto com Cloud Text-to-Speech habilitado, faturamento configurado e permissão `serviceusage.services.use` para a conta que executa a geração. O exemplo usa Kore. Para avaliar outras vozes, repita `--voice` com nomes do catálogo. [Vozes disponíveis](https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types?hl=pt-br) · [Autenticação e preparação do projeto](https://docs.cloud.google.com/text-to-speech/docs/create-audio-text-command-line)

A primeira execução é uma prévia que informa as faixas novas e o total de caracteres sem chamar a API. Em 10 de novembro de 2026, a tabela do Google informava franquia de 1 milhão de caracteres e US$ 30 por milhão após a franquia para Chirp 3 HD. Confirme a tabela, a franquia já usada e o orçamento antes de autorizar. A cobrança é pela geração. Durante a leitura, o navegador baixa os arquivos estáticos. [Preços do Google Cloud Text-to-Speech](https://cloud.google.com/text-to-speech/pricing) · [Cotas e limites](https://docs.cloud.google.com/text-to-speech/quotas)

```powershell
npm run audio:generate -- --provider google-chirp3-hd --voice pt-BR-Chirp3-HD-Kore
```

Com o projeto configurado e autorização do responsável, obtenha um token OAuth temporário no terminal autenticado. Use o token somente no ambiente de geração e remova-o ao terminar.

```powershell
$env:FISIO_TTS_PROJECT = "id-do-projeto-autorizado"
$env:FISIO_TTS_ACCESS_TOKEN = (gcloud auth print-access-token)
try {
  npm run audio:generate -- --provider google-chirp3-hd --voice pt-BR-Chirp3-HD-Kore --generate --authorize-paid
} finally {
  Remove-Item Env:FISIO_TTS_ACCESS_TOKEN -ErrorAction SilentlyContinue
}
```

## Adicionar ou atualizar narrações

1. Atualize a aula na fonte usual. O catálogo reutiliza os textos das etapas, incluindo as versões faladas das fórmulas, a descrição do esquema e o glossário. Em `src/lib/narration-pronunciation.ts`, ajuste leituras de unidades e abreviações que precisem de uma forma falada própria. Para mensagens fixas, use `src/lib/narration-messages.ts`.
2. Rode a prévia de geração. Use `--prefix` para limitar por caminho, por exemplo `--prefix respiratorio/mecanica-respiratoria/introducao`. Uma voz aparece em um reprodutor quando cobre todos os trechos que ele oferece.
3. Gere e escute amostras com o volume de uso normal. Confira termos científicos, números, fórmulas, pausas, transições e diferenças de volume em relação a outras vozes. Repita a revisão antes de publicar uma nova voz.
4. Execute `npm run audio:generate -- --verify` para conferir as referências, os arquivos e a revisão dos textos. Em caso de alteração, regenere as faixas afetadas em cada voz publicada ou retire as referências desatualizadas. Inclua no envio o manifesto e os MP3 referenciados.

O catálogo organiza os arquivos por módulo, aula e seção. Os nomes incluem a voz e uma impressão da revisão para que versões novas tenham URLs distintas. O contrato de provedor fica em `scripts/narration-providers.ts`. O reprodutor usa apenas as URLs de MP3 e os metadados de voz no manifesto.

## Validação

O piloto tem 60 MP3, cerca de 18 minutos de áudio e 8,44 MiB. O FFmpeg decodificou todos os arquivos. A exportação local foi testada no Chrome 157 e no Edge 157 no Windows, e em perfis móveis emulados com Chromium e WebKit. A integração com o microfone foi testada com reconhecimento simulado. A revisão auditiva, o uso com leitores de tela e o teste em celulares físicos ainda estão pendentes.

1. Execute `npm run audio:generate -- --verify`, `npm run typecheck`, `npm run build` e `npm run test:e2e`. Na prévia local, abra as duas aulas e uma etapa guiada de cada uma. Confira início por ação explícita, pausa, retomada, repetição, retorno ao começo e interrupção.
2. No computador e em um celular, teste a troca de voz, a velocidade, o andamento e a permanência do texto. Repita com o leitor de tela e acione **Interromper** se a leitura competir com o áudio assistivo. Provoque a indisponibilidade de um MP3 e confira **Usar voz do navegador**.
3. Com um microfone real, inicie a leitura por voz, verifique a pausa da escuta e diga **Continuar leitura** após o fim do trecho. Ao trocar de tela ou sair do aplicativo, confira o encerramento do áudio. Valide os fluxos no Chrome para Android e no Safari para iOS, além de um navegador de computador.
4. Após criar a prévia na Vercel, abra `/audio/manifest.json` no domínio da prévia. Confira HTTP 200 e pelo menos um MP3 de cada módulo e uma mensagem de interface. No navegador, confirme que os MP3 respondem como áudio e que o player reproduz os arquivos antes de promover a prévia. Repita a checagem no domínio de produção depois da publicação. [Pasta pública no Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/public-folder) · [Next.js na Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
