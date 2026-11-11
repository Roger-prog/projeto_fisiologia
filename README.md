# FisioAcessível

Plataforma de estudos de Fisiologia Humana para monitoria universitária, com foco inicial em Engenharia Biomédica. As aulas combinam explicações em português brasileiro, leitura em voz alta, diagramas descritos, exercícios, revisões espaçadas e simulações.

O catálogo reúne 13 tópicos de dois sistemas e seis aulas publicadas. O módulo cardiovascular inclui introdução, músculo cardíaco, ciclo cardíaco, regulação do bombeamento e débito cardíaco. O módulo respiratório inclui Mecânica Respiratória.

## Executar no computador

Use Node.js 24, indicado no arquivo `.node-version`, e npm.

```sh
npm ci
npm run dev
```

Abra [localhost:3000](http://localhost:3000). Os comandos abaixo geram e abrem uma prévia da exportação de produção.

```sh
npm run build
npm run preview
```

A prévia serve o diretório `out/` em [127.0.0.1:4173](http://127.0.0.1:4173).

## Usar os recursos de estudo

- Em **Modo completo**, consulte a aula integral, os exemplos, as descrições sequenciais dos diagramas e os exercícios.
- Em **Modo guiado**, leia ou ouça uma etapa por vez. Use os links de navegação para voltar ou avançar e marque as etapas concluídas quando quiser. **Continuar estudando**, na página inicial, volta à última aula ou à seção registrada. No modo completo, a seção é registrada quando você segue um link para ela.
- Em **Interação por voz**, acione o botão de ativação pelo atalho de teclado, pelo toque ou pela tecnologia assistiva do dispositivo. Escolha como receber os avisos de escuta. Diga **Mostrar módulos**, **Continuar estudando** ou **Ajuda**. Abrir uma aula pelo nome inicia no Modo Completo e apresenta os três modos. Para registrar uma resposta, escolha a alternativa e confirme em outro turno.
- A **Leitura em voz alta** oferece narração neural em português brasileiro nas seis aulas, com os mesmos arquivos para trechos em comum nos modos Completo e Guiado. Selecione a voz e a velocidade antes de começar. Use **Pausar**, **Continuar**, **Interromper** ou **Voltar ao começo**. [Configuração da narração](docs/narracao-neural.md) · [Auditoria dos arquivos](docs/auditoria-narracao.md)
- Em **Exercícios de fixação**, confira a resposta, leia a explicação e consulte o trecho da aula relacionado. Ao concluir, veja o desempenho por conceito e refaça uma questão ou a atividade inteira.
- Em **Modo revisão**, consulte os resumos e tente recuperar as respostas antes de abrir os cartões. **Minhas Revisões** reúne a agenda, os itens que precisam de prática, o histórico e sessões curtas com cartões e questões que você já respondeu.
- Em **Simulações**, compare duas frequências cardíacas com valores numéricos e batimentos sintéticos opcionais. Na simulação respiratória, percorra quatro fases da respiração tranquila e acompanhe a explicação sobre diafragma, volume, pressão e fluxo de ar.
- No menu **Acessibilidade**, ajuste o tamanho do texto ou ative o alto contraste. A simulação respiratória respeita a preferência de movimento reduzido. Os controles podem ser operados por teclado.

### Agenda e dados locais

A configuração inicial de `src/lib/review-schedule.ts` usa **1, 3 e 7 dias do calendário local**. A primeira programação usa 1 dia. Quando chega o dia de revisão, lembrar com facilidade avança o intervalo até o limite configurado. Lembrar com dificuldade recua um intervalo e não lembrar retorna ao primeiro. Antecipar uma revisão pode manter ou adiantar a data prevista. Os intervalos servem para testar o protótipo.

O site usa a chave `fisioacessivel:study:v1` no `localStorage` da origem atual. A leitura dos dados antigos mantém preferências, última aula, conclusões e respostas. A primeira gravação no formato estendido acrescenta etapas concluídas, última etapa guiada, registros de prática, agenda e histórico de até 100 avaliações. **Apagar progresso** em **Minhas Revisões** ou **Revisão rápida** apaga os dados de estudo e mantém as preferências de acessibilidade. Se o armazenamento estiver bloqueado, o estado fica em memória durante a sessão da página.

### Comandos de voz

O reconhecimento usa a Web Speech API quando disponível. O navegador pode solicitar permissão após a ativação explícita. A escuta pausa durante a narração e quando a página fica em segundo plano, com retomada quando permitida. A interpretação aceita frases equivalentes e pequenas variações nos comandos de navegação. O navegador pode processar a fala em um serviço remoto. O diagnóstico padrão registra eventos técnicos em memória e a amostra temporária de transcrição exige uma opção adicional. [Comandos, privacidade e testes manuais](docs/interacao-por-voz.md)

## Testar

```sh
npm run typecheck
npm run audio:audit
npx playwright install chromium
npm run build
npm run audio:audit -- --export
npm run test:e2e
```

O Playwright inicia e encerra a prévia estática na porta 4173. Encerre uma prévia iniciada manualmente antes de rodar a suíte. Os testes verificam as rotas, a leitura integral com JavaScript e imagens indisponíveis, a persistência de progresso, a revisão espaçada, os exercícios, os comandos de voz com APIs simuladas e as simulações sem som. As análises de axe usam as regras disponíveis de nível A e AA até WCAG 2.2 e incluem tela de 320 px com alto contraste e texto ampliado.

### Validação manual pendente

WCAG 2.2 AA é a meta de desenvolvimento. Os testes automatizados cobrem critérios verificáveis no navegador. [WCAG 2.2 — W3C](https://www.w3.org/TR/WCAG22/)

- **NVDA no Windows, com Chrome ou Firefox.** Percorrer títulos e regiões, verificar a mudança de foco entre etapas e entre perguntas, conferir os anúncios de feedback, conclusão e exclusão. Ler as fórmulas, as descrições sequenciais e os estados das simulações.
- **VoiceOver no iOS e TalkBack no Android.** Percorrer uma aula guiada, agendar uma revisão, comparar frequências e avançar pelas fases da respiração com os gestos e ajustes de texto do dispositivo.
- **Acionadores e controles alternativos.** Percorrer os controles na ordem de foco, iniciar e parar áudio e repetir uma etapa ou questão com o dispositivo usado pelo estudante.
- **Microfone e voz real em português brasileiro.** Testar permissão, comandos, alternância entre escuta e narração e reativação em Chrome e Safari com microfones reais. Repetir com o leitor de tela ativo. [Roteiro de interação por voz](docs/interacao-por-voz.md)
- **Uso com estudantes.** Observar a retomada de uma etapa, a compreensão dos exemplos e a revisão com pessoas cegas ou com baixa visão, pessoas com mobilidade reduzida e pessoas com dificuldades de memória. Verificar legibilidade com ampliação e visibilidade do foco.

## Publicar a atualização

1. Na Vercel, use o projeto existente conectado ao repositório e mantenha a configuração do Next.js. Confira o Node.js 24 nas configurações de build.
2. Crie uma prévia com a atualização. Confira o manifesto e a reprodução no Modo Completo, especialmente nas quatro aulas cardiovasculares que receberam novas faixas. Valide também uma etapa guiada, a agenda de revisões e as simulações. [Roteiro da narração na Vercel](docs/narracao-neural.md#validação)
3. Publique na origem de produção existente para que o navegador possa carregar o progresso salvo nesse domínio. As prévias em outros domínios têm armazenamento separado.

Para Cloudflare Pages, selecione **Next.js (Static HTML Export)**, use `npm run build` e informe `out` como diretório de saída. Também é possível enviar `out/` pelo Direct Upload. [Next.js na Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs) · [Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/) · [Exportação estática do Next.js](https://nextjs.org/docs/app/guides/static-exports)

Use `npm run build` ao gerar a exportação no Windows. O pós-build corrige os nomes dos arquivos de navegação que o Next.js gera com separadores de caminho do Windows. [Issue do Next.js](https://github.com/vercel/next.js/issues/85374)

## Adicionar conteúdo

| Local | Responsabilidade |
| --- | --- |
| `src/app/aulas/` | Rotas integrais e etapas guiadas exportadas estaticamente |
| `src/app/revisao/` e `src/app/minhas-revisoes/` | Revisão rápida e agenda de prática |
| `src/app/simulacoes/` e `src/components/simulations/` | Páginas e controles das duas simulações |
| `src/components/study/` | Seletor de modo, player, exercícios, progresso e revisão |
| `src/components/voice/` e `src/lib/voice-*.ts` | Painel, interpretação, reconhecimento e sessão de voz |
| `src/data/types.ts` | Tipos de módulo, aula, questões, cartões e créditos |
| `src/data/modules.ts` | Catálogo, títulos e ordem dos tópicos |
| `src/data/lessons/` e `src/data/questions/` | Texto das aulas, cartões e exercícios |
| `src/data/references.ts` e `src/data/credits.ts` | Bibliografia e origem das figuras |
| `src/lib/study-storage.ts` | Leitura do progresso anterior e armazenamento do formato estendido |
| `src/lib/lesson-steps.ts` e `src/lib/lesson-speech.ts` | Organização das etapas e texto da narração |
| `src/lib/review-schedule.ts` e `src/lib/speech-playback.ts` | Intervalos de revisão e síntese de voz |
| `src/lib/narration-catalog.ts`, `scripts/` e `public/audio/` | Catálogo, geração, auditoria e arquivos neurais |
| `public/diagrams/` e `public/licencas/` | Diagramas das aulas e avisos de licenças |
| `tests/` | Suíte Playwright |

Para disponibilizar uma aula, crie os dados tipados, adicione a aula à lista em `src/data/index.ts` e associe o `lessonId` ao tópico correspondente em `src/data/modules.ts`. Gere as faixas que faltarem, inclua o manifesto com os MP3 e rode a auditoria. Preserve os IDs das aulas, questões e opções já usadas, pois o progresso usa esses identificadores.

Os modos de estudo usam os mesmos dados de aula. Cada seção tem objetivo, explicação e resumo, e os exemplos ficam vinculados à seção que os explica. A agenda identifica cartões e questões pelo ID estável do item e da aula. O reprodutor usa o contrato `AudioPlayback` para arquivos e síntese do navegador. [Como adicionar gravações](docs/narracao-neural.md#adicionar-ou-atualizar-narrações)

Os diagramas do piloto foram desenhados para acompanhar a sequência das aulas em português. As alternativas abertas avaliadas não traziam o mesmo recorte didático. As descrições, a autoria e a situação de licença estão na página **Referências e créditos**. [Esquema circulatório avaliado](https://commons.wikimedia.org/wiki/File:Circulatory_System_pt.svg) · [Esquema respiratório avaliado](https://commons.wikimedia.org/wiki/File:Mouvement_diaphragme_respiration.svg)
