# Narração com voz neural

As aulas **Introdução ao Sistema Cardiovascular** e **Mecânica Respiratória** têm gravações em português brasileiro, geradas por inteligência artificial com o modelo local Cadu do Piper. A voz serve de piloto para a revisão de pronúncia, ritmo e naturalidade. O texto científico continua disponível nos dois modos de estudo. [Ficha do modelo Cadu](https://huggingface.co/rhasspy/piper-voices/raw/main/pt/pt_BR/cadu/medium/MODEL_CARD) · [Licenciamento dos dados de voz](https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/COMMERCIAL_USE.md)

Escolha a voz e a velocidade em **Leitura em voz alta**. A escolha acompanha a navegação e o recarregamento na mesma aba, inclusive se faltarem gravações para a voz selecionada. **Voltar ao começo** retorna ao início e aguarda uma nova ação para tocar. O andamento indica a fração dos trechos lidos. O navegador lista as vozes instaladas e a seleção automática dá prioridade a português do Brasil e a vozes identificadas como naturais ou aprimoradas.

Ao iniciar pelo botão do reprodutor, a etapa ou aula é reproduzida em sequência. Pelo microfone, o site lê um trecho por vez. A escuta é suspensa durante a preparação e a reprodução, inclusive com o player pausado. Entre trechos, use **Continuar leitura**, **Repetir** ou **Parar leitura**. Boas-vindas, ajuda, navegação, questões, alternativas, feedback e cartões de revisão são gravados. Quando uma mensagem combina faixas, todas pertencem à mesma voz. [Limites da interação por voz](interacao-por-voz.md)

O gerenciador compartilhado consulta o manifesto e verifica os MP3 da solicitação antes de tocar. As verificações bem-sucedidas são reaproveitadas na aba. Falhas temporárias recebem uma nova tentativa. Se a gravação continuar indisponível ou a mensagem não tiver gravação, o painel preserva o texto completo para leitura visual e por leitor de tela. Use **Tentar narração novamente** no painel de voz, **Tentar voz neural novamente** no reprodutor ou **Usar voz do navegador**. O comando **Usar voz do navegador** também autoriza a alternativa. Essa opção anuncia a troca e lê a solicitação desde o começo com a voz do navegador. A escolha de voz para as próximas mensagens e aulas permanece salva. Em navegadores que exigem um gesto direto para iniciar mídia, acione a nova tentativa pelo botão.

## Comparar vozes

As três amostras locais usam a mesma explicação sobre débito cardíaco, com a fórmula em palavras e os mesmos valores numéricos. Escute em velocidade 1× e no mesmo volume. Compare a clareza dos termos científicos, a ênfase na relação entre as grandezas e a continuidade entre frases.

| Voz | Amostra | Duração | Loudness integrado |
| --- | --- | ---: | ---: |
| Cadu · Piper | [Ouvir Cadu](amostras-narracao/piper-pt-br-cadu-medium-b91518dfcf69dc12.mp3) | 24,31 s | −20,2 LUFS |
| Dora · Kokoro | [Ouvir Dora](amostras-narracao/kokoro-pf-dora-7c5fea6ee2c71a24.mp3) | 22,55 s | −20,3 LUFS |
| Alex · Kokoro | [Ouvir Alex](amostras-narracao/kokoro-pm-alex-2b69b3d11ad41953.mp3) | 22,63 s | −20,1 LUFS |

O FFmpeg decodificou as três faixas e mediu pico verdadeiro de −2,3 dBTP em todas. A transcrição automática local recuperou os quatro valores numéricos. O termo “sistólico” apareceu com divergências de transcrição nas três faixas e merece conferência auditiva. Cadu permanece no site enquanto as amostras aguardam avaliação humana. [Vozes brasileiras do Kokoro](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md#brazilian-portuguese)

Para reproduzir a comparação local, use a configuração Piper abaixo com `--samples --provider piper --generate`. Para Dora e Alex, instale `kokoro-onnx==0.6.0` em um ambiente Python isolado. Guarde `kokoro-v1.0.fp16.onnx` e `voices-v1.0.bin` fora do repositório e indique os caminhos em `FISIO_KOKORO_MODEL` e `FISIO_KOKORO_VOICES`. Se necessário, configure também `FISIO_KOKORO_PYTHON` e `FISIO_FFMPEG`. Rode `npm run audio:generate -- --samples --provider kokoro --generate`. As amostras ficam em `docs/amostras-narracao/`. [Arquivos de modelo do Kokoro ONNX](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.1)

## Gerar localmente com Piper

O build e a Vercel servem os MP3 e o manifesto já gerados em `public/audio/`. Python, Piper, o modelo e FFmpeg são usados apenas na geração. A versão do Cadu aceita pelo script deriva da base rdh. Mantenha o `.onnx` e o `.onnx.json` lado a lado, fora do repositório. [CLI do Piper](https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/CLI.md) · [Revisão do modelo usada no piloto](https://huggingface.co/rhasspy/piper-voices/tree/cf910fb59f1d79ab3b625a63993a108751c6c25d/pt/pt_BR/cadu/medium)

Em um ambiente Python isolado, instale `piper-tts==1.8.0` e execute `python -m piper.download_voices --download-dir CAMINHO pt_BR-cadu-medium`. Configure `FISIO_PIPER_MODEL` com o caminho absoluto do arquivo `pt_BR-cadu-medium.onnx`. Se necessário, configure `FISIO_PIPER_PYTHON` e `FISIO_FFMPEG` com os caminhos dos executáveis. Por padrão, o script usa `python` e `ffmpeg` do PATH. A geração do piloto usa mono a 22,05 kHz, 64 kb/s, pausas de 240 ms entre frases e normalização com alvo de −19 LUFS.

```powershell
npm run audio:generate -- --provider piper
npm run audio:generate -- --provider piper --generate
npm run audio:generate -- --verify
```

## Gerar com Google Cloud Chirp 3 HD

O provedor opcional usa Chirp 3 HD em português brasileiro e requer um projeto com Cloud Text-to-Speech habilitado, faturamento configurado e permissão `serviceusage.services.use` para a conta que executa a geração. A prévia de comparação seleciona **Kore, Charon e Aoede** para a mesma explicação das amostras locais. Para personalizar a lista, repita `--voice` com nomes do catálogo. [Vozes disponíveis](https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types?hl=pt-br) · [Autenticação e preparação do projeto](https://docs.cloud.google.com/text-to-speech/docs/create-audio-text-command-line)

A primeira execução é uma prévia que informa as faixas novas e o total de caracteres sem chamar a API. Em 10 de novembro de 2026, a tabela do Google informava franquia de 1 milhão de caracteres e US$ 30 por milhão após a franquia para Chirp 3 HD. Confirme a tabela, a franquia já usada e o orçamento antes de autorizar. A cobrança é pela geração. Durante a leitura, o navegador baixa os arquivos estáticos. [Preços do Google Cloud Text-to-Speech](https://cloud.google.com/text-to-speech/pricing) · [Cotas e limites](https://docs.cloud.google.com/text-to-speech/quotas)

```powershell
npm run audio:generate -- --samples --provider google-chirp3-hd
```

Com o projeto configurado e autorização do responsável, obtenha um token OAuth temporário no terminal autenticado. Use o token somente no ambiente de geração e remova-o ao terminar.

```powershell
$env:FISIO_TTS_PROJECT = "id-do-projeto-autorizado"
$env:FISIO_TTS_ACCESS_TOKEN = (gcloud auth print-access-token)
try {
  npm run audio:generate -- --samples --provider google-chirp3-hd --generate --authorize-paid
} finally {
  Remove-Item Env:FISIO_TTS_ACCESS_TOKEN -ErrorAction SilentlyContinue
}
```

## Adicionar ou atualizar narrações

1. Atualize a aula na fonte usual. O catálogo mantém parágrafos inteiros e agrupa os mais curtos em trechos com alvo de 700 bytes em UTF-8. As versões faladas das fórmulas, a descrição do esquema e o glossário continuam na leitura. Em `src/lib/narration-pronunciation.ts`, ajuste leituras de unidades e abreviações. Para mensagens fixas, use `src/lib/narration-messages.ts`.
2. Rode a prévia de geração. Use `--prefix` para limitar por caminho, por exemplo `--prefix respiratorio/mecanica-respiratoria/introducao`. Para gerar o catálogo completo de uma voz Chirp aprovada, use `--provider google-chirp3-hd --voice NOME --generate --authorize-paid` sem `--samples`. A prévia informa o volume de geração antes da autorização.
3. Gere e escute amostras com o volume de uso normal. Confira termos científicos, números, fórmulas, pausas, transições e diferenças de volume em relação a outras vozes. Repita a revisão antes de publicar uma nova voz.
4. Execute `npm run audio:generate -- --verify` para conferir as referências, os arquivos e a revisão dos textos. Em caso de alteração, regenere as faixas afetadas em cada voz publicada ou retire as referências desatualizadas. Inclua no envio o manifesto e os MP3 referenciados.

O catálogo organiza os arquivos por módulo, aula e seção. Os nomes incluem a voz e uma impressão da revisão para que versões novas tenham URLs distintas. O contrato de provedor fica em `scripts/narration-providers.ts`. O reprodutor usa apenas as URLs de MP3 e os metadados de voz no manifesto.

## Validação

O catálogo tem 172 MP3 e cerca de 33 minutos de áudio. A validação inclui decodificação, sequências completas em voz neural, respostas 404 e 503, alternativa explícita e permanência da voz entre rotas. A exportação local foi testada no Chrome 157 e no Edge 157 no Windows e em perfis móveis emulados. A integração com o microfone foi testada com reconhecimento simulado. A revisão auditiva humana, leitores de tela, celulares físicos e a URL publicada na Vercel ainda estão pendentes.

1. Execute `npm run audio:generate -- --verify`, `npm run typecheck`, `npm run build` e `npm run test:e2e`. Na prévia local, abra as duas aulas e uma etapa guiada de cada uma. Confira início por ação explícita, pausa, retomada, repetição, retorno ao começo e interrupção.
2. No computador e em um celular, teste a troca de voz, a velocidade, o andamento e a permanência do texto. Repita com o leitor de tela e acione **Interromper** se a leitura competir com o áudio assistivo. Provoque a indisponibilidade de um MP3 e confira **Usar voz do navegador**.
3. Com um microfone real, inicie a leitura por voz, verifique a pausa da escuta e diga **Continuar leitura** após o fim do trecho. Ao trocar de tela ou sair do aplicativo, confira o encerramento do áudio. Valide os fluxos no Chrome para Android e no Safari para iOS, além de um navegador de computador.
4. Na prévia da Vercel, abra `/audio/manifest.json` e confira HTTP 200. Teste `HEAD` e reprodução de um MP3 de cada módulo e de uma mensagem de interface. Confira o tipo `audio/mpeg` e reproduza um feedback composto até o fim. Repita a checagem no domínio de produção após publicar. [Pasta pública no Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/public-folder) · [Next.js na Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
