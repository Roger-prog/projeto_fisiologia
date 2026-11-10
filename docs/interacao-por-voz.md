# Interação por voz

No painel **Interação por voz**, leia o aviso de microfone e acione **Ativar interação por voz**. Se o navegador pedir permissão, escolha se deseja concedê-la. Use uma página HTTPS ou o endereço local de desenvolvimento. Depois que o painel indicar **Escutando**, fale um comando curto em português brasileiro.

| Onde | Exemplos de comandos |
| --- | --- |
| Qualquer tela | **Ajuda**, **ouvir minhas opções**, **continuar de onde parei**, **listar aulas**, **abrir aula Mecânica Respiratória**, **Minhas Revisões**, **encerrar voz** |
| Etapa guiada | **Próxima etapa**, **avançar**, **etapa anterior**, **ouvir a etapa**, **repetir explicação**, **fazer exercícios** |
| Intervalo entre trechos da narração | **Continuar leitura** ou **parar leitura** |
| Exercícios | **Ouvir pergunta**, **letra B**, **confirmar resposta**, **próxima pergunta** e **pergunta anterior** |
| Sessão de revisão já aberta em uma pergunta | **Ouvir pergunta**, **alternativa B** e **confirmar resposta** |

Diga a letra e aguarde o retorno da seleção antes de dizer **confirmar resposta** em um novo turno. Frases negativas ou com vários comandos juntos não são tratadas como confirmação. A confirmação por voz só aceita uma escolha feita por voz na pergunta atual. Também é possível selecionar com os controles da página e usar **Conferir resposta**.

A narração iniciada por voz lê um trecho e devolve o turno ao microfone. Durante a fala, use **Parar áudio** no painel para interromper imediatamente. O comando **parar leitura** funciona quando a escuta é retomada entre trechos. O player convencional continua disponível com sua leitura integral. **Encerrar interação por voz** finaliza a sessão pelo teclado, toque ou acionador.

## Sessão e privacidade

O painel mostra quando está pedindo permissão, escutando, processando ou narrando. Há uma nova tentativa após o primeiro turno sem fala ou sem resultado. A sessão termina após duas tentativas consecutivas sem comando, ao ocultar a página ou ao atingir dez minutos. Se o navegador negar, suspender ou interromper a captura, o painel informa como reativar. As aulas e o progresso continuam disponíveis.

O reconhecedor usa a Web Speech API do navegador. O processamento pode ocorrer no dispositivo ou depender do serviço de voz escolhido pelo navegador. Nesse segundo caso, o navegador pode enviar áudio captado ao serviço para transcrição. O FisioAcessível usa o texto retornado para interpretar o comando em memória, sem gravar áudio ou transcrições no armazenamento do site e sem anexar progresso ou identificadores de conta à solicitação de reconhecimento. Evite falar dados pessoais durante a escuta. O painel pausa a escuta antes de reproduzir áudio da plataforma e oferece encerramento explícito da sessão. [Especificação da Web Speech API](https://webaudio.github.io/web-speech-api/) · [Implementação de reconhecimento no Chrome](https://developer.chrome.com/blog/voice-driven-web-apps-introduction-to-the-web-speech-api)

## O que verificar em cada dispositivo

Os testes automatizados usam Chromium em computador, com eventos de reconhecimento e síntese simulados, além do cenário sem suporte. Cobrem variações de frases, navegação, retomada, confirmação em dois turnos, troca entre microfone e narração, silêncio, permissão negada e suspensão da página. A API exposta pelo navegador não garante que o microfone e o serviço estejam disponíveis naquele dispositivo.

No Windows, Chrome 157 e Edge 157 foram verificados quanto à detecção da API e à navegação por teclado na exportação estática. A fala e as permissões nesses navegadores ainda precisam ser exercitadas com um microfone real.

Faça a verificação manual com um microfone real no Chrome em computador e Android e no Safari em iPhone, iPad ou macOS. Anote navegador, versão, sistema, idioma, resultado do pedido de permissão e quais comandos funcionaram após a primeira ativação. Em Safari, confira a configuração da Siri quando o reconhecimento estiver indisponível. [Reconhecimento de fala no WebKit](https://webkit.org/blog/11648/new-webkit-features-in-safari-14-1/)

1. Ative pelo teclado ou pelo recurso assistivo do estudante. Teste permissão concedida, negada e revogada durante a sessão. Confirme que os controles convencionais continuam utilizáveis.
2. Abra uma aula pelo nome, avance com **próxima** ou **avançar** e volte uma etapa. Inicie a narração, verifique que a escuta pausa e tente **continuar leitura** e **parar leitura** no intervalo.
3. Abra os exercícios, ouça uma pergunta, selecione uma letra e confira que nada foi registrado. Confirme em outro turno e confira o comentário. Experimente **não confirmar resposta** e uma frase desconhecida.
4. Fique em silêncio, alterne de aplicativo e volte. Reative a sessão e peça **continuar de onde parei**. Verifique a etapa e a resposta salvas após fechar e reabrir o navegador.
5. Repita com TalkBack, VoiceOver ou NVDA, conforme o dispositivo. Observe a leitura do estado de escuta, a possibilidade de localizar **Parar áudio** e a convivência da síntese do site com o leitor de tela.

## Possível segundo reconhecedor

`VoiceRecognizer`, em `src/lib/voice-recognition.ts`, separa a captura e transcrição do interpretador de comandos e do gerenciador de sessão. Um reconhecedor local poderia captar áudio com consentimento explícito, transcrever em um worker com um modelo que suporte português brasileiro e liberar o microfone ao fim de cada turno. Seria preciso validar tamanho do modelo, memória, latência em celulares e qualidade da transcrição antes de oferecer a opção.

Uma alternativa remota com credenciais próprias exigiria um backend separado da exportação estática, com autenticação do serviço, limites de duração e taxa, descarte de áudio, ausência de registros com voz e uma explicação específica sobre dados e retenção. O site precisaria de uma opção explícita para escolher esse modo e um caminho de volta aos controles convencionais em caso de falha.
