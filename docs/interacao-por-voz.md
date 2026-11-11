# Interação por voz

No painel **Interação por voz**, acione **Ativar interação por voz**. Pelo teclado, pressione Tab até **Ir para a interação por voz**, Enter para chegar ao painel e Tab até o botão. Acione com Enter ou Espaço. Leitores de tela e acionadores adaptados podem usar a ação padrão do botão. Se o navegador pedir permissão, escolha se deseja concedê-la. Use HTTPS ou o endereço local de desenvolvimento.

Se o controle por voz do sistema já estiver configurado, peça a ele para acionar **Ativar interação por voz** pelo rótulo ou pelo número sobreposto, conforme o idioma e o recurso do dispositivo. Essa primeira ação vem do sistema operacional. Depois dela, os comandos de estudo são reconhecidos pelo navegador. **Lembrar preferência por interação por voz** destaca o botão em visitas futuras. Um novo carregamento completo da página exige ativação explícita do microfone. [Voice Access no Android](https://support.google.com/accessibility/android/answer/6151854?hl=pt-BR) · [Acesso por voz no Windows](https://support.microsoft.com/en-us/accessibility/windows/voice-access/use-voice-to-interact-with-items-on-the-screen) · [Controle por Voz da Apple](https://support.apple.com/111778)

Em **Avisos do microfone**, escolha **Sinais sonoros**, **Mensagens faladas** ou **Leitor de tela**. Aguarde o aviso de prontidão e a indicação **Escutando** antes de falar. O painel apresenta erros de permissão, necessidade de reativação e encerramento. Os avisos de prontidão acompanham a ativação e as retomadas após interações ou interrupções. O silêncio mantém a sessão sem repetir avisos continuamente.

| Onde | Exemplos de comandos |
| --- | --- |
| Qualquer tela | **Ajuda**, **o que eu posso fazer?**, **mostrar módulos**, **mostrar aulas**, **continuar estudando**, **encerrar voz** |
| Módulos | **Coração**, **respiratório**, **escolher aula**, **abrir aula Mecânica Respiratória** |
| Aula | **Quero a aula inteira**, **passo a passo**, **quero revisar**, **próxima etapa**, **repete**, **fazer exercícios** |
| Intervalo entre trechos da narração | **Continuar leitura** ou **parar leitura** |
| Exercícios e revisão de perguntas | **Ouvir pergunta**, **letra B**, **confirmar**, **próxima pergunta** e **pergunta anterior** |
| Revisão da aula | **Ouvir pergunta**, **revelar resposta**, **próxima pergunta**, **modo completo** |

Uma aula pedida pelo nome abre no Modo Completo e apresenta os modos por voz. **Continuar**, **onde eu parei?**, **voltar à aula**, **quero continuar estudando** e **voltar para minha aula** recuperam o ponto salvo. Ao trocar de modo, a plataforma aproveita a seção atual ou a etapa guiada registrada. **Quero voltar** pede uma escolha antes de navegar. Responda **Etapa anterior** ou **Sair da aula**.

Diga a letra e aguarde o retorno da seleção antes de dizer **confirmar resposta** em um novo turno. Frases negativas ou com vários comandos juntos não são tratadas como confirmação. A confirmação por voz só aceita uma escolha feita por voz na pergunta atual. Também é possível selecionar com os controles da página e usar **Conferir resposta**.

A narração iniciada por voz lê um trecho e devolve o turno ao microfone. Durante a fala, use **Parar áudio** no painel para interromper imediatamente. O comando **parar leitura** funciona quando a escuta é retomada entre trechos. O player convencional continua disponível com sua leitura integral. **Encerrar interação por voz** finaliza a sessão pelo teclado, toque ou acionador.

As seis aulas oferecem gravações neurais e voz do navegador. A escolha do reprodutor vale para as aulas e as mensagens da aba. Se uma gravação estiver indisponível, a mensagem completa fica no painel. Diga **Usar voz do navegador** ou acione a opção no painel para ouvir aquela solicitação com a alternativa anunciada. A preferência continua salva. Alguns navegadores podem exigir uma nova ação direta para autorizar a reprodução de mídia. [Narração, alternativas e validação](narracao-neural.md)

## Sessão e privacidade

O painel indica autorização, escuta, processamento, narração, suspensão e recuperação. O silêncio por si só mantém a sessão ativa, inclusive além de dez minutos. Ao ocultar a página, a captura é suspensa. Ao voltar à mesma página, o site tenta retomar uma sessão já autorizada. A navegação interna mantém a sessão e um novo carregamento completo começa com o microfone desativado.

O reconhecimento permanece organizado em turnos, com `continuous = false`. A opção contínua permite vários resultados finais numa chamada, mas o site precisa liberar a escuta antes de cada resposta narrada. A retomada usa o evento de encerramento da API para separar os turnos e aguarda a narração terminar. Interrupções inesperadas e erros temporários de rede têm até quatro novas tentativas, após 0,5, 1, 2 e 4 segundos. O silêncio usa a espera progressiva sem esse limite de tentativas. Se a recuperação se esgotar ou o navegador exigir outro gesto, o painel orienta a reativação. Permissão negada ou revogada encerra a captura e exige uma nova ação do usuário. [Turnos e eventos de reconhecimento na Web Speech API](https://webaudio.github.io/web-speech-api/#speechreco-section)

O sinal e o aviso falado tocam com a captura pausada. Se o navegador exigir uma nova ação para retomar após o primeiro aviso, a opção **Leitor de tela** permite receber a indicação pelo estado acessível no primeiro turno. [Política de áudio no Chrome](https://developer.chrome.com/blog/autoplay/#web-audio)

O navegador transcreve a fala. O interpretador do site usa essa transcrição, a confiança informada pelo navegador e o contexto da página. A aproximação aceita uma pequena diferença quando há uma opção única em comandos reversíveis. Escolher e confirmar uma alternativa exige correspondência direta, com seleção e confirmação em turnos separados.

O reconhecedor usa a Web Speech API do navegador. O processamento pode ocorrer no dispositivo ou depender do serviço de voz escolhido pelo navegador. Nesse segundo caso, o navegador pode enviar áudio captado ao serviço para transcrição. O FisioAcessível usa o texto retornado para interpretar o comando em memória, sem gravar áudio ou transcrições no armazenamento do site e sem anexar progresso ou identificadores de conta à solicitação de reconhecimento. Evite falar dados pessoais durante a escuta. O painel pausa a escuta antes de reproduzir áudio da plataforma e oferece encerramento explícito da sessão. [Especificação da Web Speech API](https://webaudio.github.io/web-speech-api/) · [Implementação de reconhecimento no Chrome](https://developer.chrome.com/blog/voice-driven-web-apps-introduction-to-the-web-speech-api)

## O que verificar em cada dispositivo

Os testes automatizados usam Chromium em computador, com eventos de reconhecimento e síntese simulados. Verificam comandos consecutivos após uma ativação, silêncio e sessões longas com relógio virtual, separação entre narração e escuta, navegação interna, recuperação, suspensão, bloqueios de permissão e encerramento. A API exposta pelo navegador não garante que o microfone e o serviço estejam disponíveis naquele dispositivo.

No Windows, Chrome 157 e Edge 157 foram verificados na exportação estática quanto ao atalho, à ativação por teclado e à resposta em região viva quando o navegador bloqueia o microfone. A captação com microfone físico, os avisos em dispositivos móveis e a leitura efetiva por tecnologias assistivas ainda exigem os testes manuais abaixo.

Faça a verificação manual com microfone real no Chrome e Edge para Windows, no Chrome para Android e, conforme disponibilidade, no Safari. Anote navegador, versão, sistema, idioma, resultado do pedido de permissão e comandos que funcionaram após a primeira ativação. Em Safari, confira a configuração da Siri quando o reconhecimento estiver indisponível. [Reconhecimento de fala no WebKit](https://webkit.org/blog/11648/new-webkit-features-in-safari-14-1/)

1. Ative pelo teclado ou pelo recurso assistivo do estudante. Teste cada forma de aviso de escuta e permissões concedida, negada e revogada. Avalie se o estudante percebe quando pode falar.
2. Diga **Mostrar módulos**, selecione **Coração**, abra **Propriedades do músculo cardíaco** e percorra os modos Completo, Guiado e Revisão. Em uma etapa, diga **Quero voltar** e escolha **Etapa anterior**. Inicie a narração e tente **Continuar leitura** no intervalo.
3. Abra os exercícios, ouça uma pergunta, selecione uma letra e confira que nada foi registrado. Confirme em outro turno e confira o comentário. Experimente **não confirmar resposta** e uma frase desconhecida.
4. Diga dez comandos com uma só ativação, incluindo cinco formas de retomar o estudo. Aguarde dois minutos em silêncio e diga outro comando. Mantenha uma sessão por mais de dez minutos e registre qualquer solicitação de nova ativação.
5. Alterne de aplicativo e volte. Verifique a pausa e a tentativa de retomada. Teste uma falha temporária de rede e o encerramento explícito. Após fechar e reabrir o navegador, ative por uma ação autorizada e confira a etapa e a resposta salvas.
6. Repita com TalkBack, VoiceOver ou NVDA e com o controle por voz do sistema ou acionador adaptado. Observe a leitura do estado de escuta e o acesso a **Parar áudio**. Com estudantes, registre em quais pontos conseguiram seguir de forma autônoma e quando precisaram de ajuda.

## Diagnóstico opcional

Abra a página com `?diagnostico-voz=1` e consulte **Diagnóstico de voz**. Os 40 eventos mais recentes incluem horários, códigos técnicos e decisões da interpretação. Uma decisão mostra a intenção, a confiança quando informada, alternativas consideradas e o motivo da rejeição. Para investigar a transcrição, marque **Mostrar última transcrição temporariamente** e use somente frases de teste. A amostra mais recente fica em memória por até 30 segundos e é apagada ao desativar a opção ou encerrar a sessão. O painel não grava áudio nem envia a amostra para fora da página.

- `retry-scheduled` mostra que a página ainda tenta recuperar a escuta. O código do evento distingue silêncio, falha de rede e encerramento inesperado.
- `permission-denied` indica que é preciso conferir a permissão do site e ativar por uma ação explícita.
- `release-timeout` indica que o navegador não confirmou a liberação do turno anterior. Aguarde e tente ativar novamente. Se o bloqueio persistir, recarregue a página.

## Possível segundo reconhecedor

`VoiceRecognizer`, em `src/lib/voice-recognition.ts`, separa a captura e transcrição do interpretador de comandos e do gerenciador de sessão. Um reconhecedor local poderia captar áudio com consentimento explícito, transcrever em um worker com um modelo que suporte português brasileiro e liberar o microfone ao fim de cada turno. Seria preciso validar tamanho do modelo, memória, latência em celulares e qualidade da transcrição antes de oferecer a opção.

Uma alternativa remota com credenciais próprias exigiria um backend separado da exportação estática, com autenticação do serviço, limites de duração e taxa, descarte de áudio, ausência de registros com voz e uma explicação específica sobre dados e retenção. O site precisaria de uma opção explícita para escolher esse modo e um caminho de volta aos controles convencionais em caso de falha.
