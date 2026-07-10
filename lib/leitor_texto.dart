import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';

// ============================================================================
// ESTADO GLOBAL DA ACESSIBILIDADE
// ============================================================================
final ValueNotifier<bool> acessibilidadeAtivada = ValueNotifier<bool>(false);

final FlutterTts gerenciadorVoz = FlutterTts();
bool _vozConfigurada = false;

// ============================================================================
// CONFIGURAÇÃO DA VOZ (TOM ACOLHEDOR E HUMANO)
// ============================================================================
// ============================================================================
// ESPERA INTELIGENTE PELAS VOZES DO NAVEGADOR
// ============================================================================
// No Chrome/Edge/Web em geral, a lista de vozes carrega de forma ASSÍNCRONA.
// Se a gente chamar getVoices() cedo demais (ex: no primeiro frame do app),
// ela volta VAZIA e o app nunca acha a voz premium -- é a causa nº 1 do
// "som de robô" mesmo com todo o código de busca certo.
// Essa função tenta várias vezes, com uma pequena pausa entre elas, até a
// lista aparecer (ou desistir depois de um tempo razoável).
Future<List<dynamic>> _obterVozesComEspera({int tentativas = 6}) async {
  for (int i = 0; i < tentativas; i++) {
    try {
      List<dynamic> vozes = await gerenciadorVoz.getVoices;
      if (vozes.isNotEmpty) return vozes;
    } catch (e) {
      debugPrint("Tentativa $i de buscar vozes falhou: $e");
    }
    // Espera um pouco antes de tentar de novo (dá tempo do navegador carregar)
    await Future.delayed(const Duration(milliseconds: 250));
  }
  return [];
}

Future<void> configurarTts() async {
  if (!_vozConfigurada) {
    await gerenciadorVoz.setLanguage("pt-BR");

    // ============================================================================
    // TRATAMENTO DE ERRO (evita que interrupções normais pareçam bugs)
    // ============================================================================
    // Quando a gente chama stop() + speak() rapidamente (o "freio" do sistema),
    // o navegador as vezes dispara um evento de erro do tipo "interrupted" --
    // isso é NORMAL e esperado, não é uma falha real. Só logamos erros de verdade.
    gerenciadorVoz.setErrorHandler((msg) {
      String erro = msg.toString().toLowerCase();
      if (erro.contains("interrupt") || erro.contains("canceled") || erro.contains("cancelled")) {
        // Interrupção esperada (usuário trocou de tela/clicou em outro áudio). Ignora.
        return;
      }
      debugPrint("Erro real de síntese de voz: $msg");
    });

    // ============================================================================
    // AJUSTE FINO DE AFINAÇÃO E VELOCIDADE
    // ============================================================================
    // Reduzir o Pitch para 0.95 tira aquele tom estridente e anasalado de robô
    await gerenciadorVoz.setPitch(0.95);

    // Velocidade "ritmo de conversa":
    // -> No Flutter Web (Web Speech API do navegador), 1.0 é a velocidade
    //    NORMAL de fala. Usar 0.45 aqui deixa a voz arrastada, tipo preguiça.
    // -> No mobile nativo (Android/iOS), a escala é 0.0-1.0 e ~0.5 é normal.
    // Por isso escolhemos o valor certo pra cada plataforma.
    await gerenciadorVoz.setSpeechRate(kIsWeb ? 0.95 : 0.45);

    await gerenciadorVoz.awaitSpeakCompletion(true);

    // ============================================================================
    // CAÇADOR DE VOZES PREMIUM (Tira o som de robô)
    // ============================================================================
    bool vozPremiumEncontrada = false;
    try {
      // Espera a lista de vozes carregar de verdade antes de procurar
      List<dynamic> vozesDisponiveis = await _obterVozesComEspera();

      // DIAGNÓSTICO: mostra todas as vozes pt-BR que o navegador/SO oferece,
      // pra você conseguir ver no console quais estão disponíveis de fato.
      debugPrint("--- Vozes pt-BR encontradas no dispositivo ---");
      for (var voz in vozesDisponiveis) {
        String loc = voz["locale"].toString().toLowerCase();
        if (loc.startsWith("pt-br") || loc.startsWith("pt_br")) {
          debugPrint("  -> ${voz["name"]}");
        }
      }
      debugPrint("-----------------------------------------------");

      for (var voz in vozesDisponiveis) {
        String localeVoz = voz["locale"].toString().toLowerCase();

        // Filtra só as do Brasil (aceita "pt-br", "pt_br", "pt-br-standard-a" etc.)
        if (localeVoz.startsWith("pt-br") || localeVoz.startsWith("pt_br")) {
          String nomeVoz = voz["name"].toString().toLowerCase();

          // ATENÇÃO: vozes "Microsoft Daniel/Maria/Helena" SOZINHAS (sem
          // "Online"/"Natural" no nome) são as vozes LEGADAS do Windows
          // (SAPI5) -- são exatamente as robóticas que queremos evitar!
          // As vozes boas da Microsoft sempre trazem "Online" ou "Natural"
          // no nome (ex: "Microsoft Daniel Online (Natural)").
          bool ehMicrosoftLegada = nomeVoz.contains("microsoft") &&
              !nomeVoz.contains("online") &&
              !nomeVoz.contains("natural") &&
              !nomeVoz.contains("neural");

          bool ehVozDeQualidade = !ehMicrosoftLegada &&
              (nomeVoz.contains("google") ||
                  nomeVoz.contains("premium") ||
                  nomeVoz.contains("enhanced") ||
                  nomeVoz.contains("neural") ||
                  nomeVoz.contains("wavenet") ||
                  nomeVoz.contains("natural") ||
                  nomeVoz.contains("online"));

          if (ehVozDeQualidade) {
            await gerenciadorVoz.setVoice({"name": voz["name"], "locale": voz["locale"]});
            vozPremiumEncontrada = true;
            debugPrint("Voz premium selecionada: ${voz["name"]}");
            break; // Achou uma voz boa, para de procurar!
          } else {
            debugPrint("Ignorando voz de baixa qualidade: ${voz["name"]}");
          }
        }
      }

      if (!vozPremiumEncontrada) {
        debugPrint("Nenhuma voz premium pt-BR encontrada. Usando a voz padrão do sistema.");
      }
    } catch (e) {
      // Se o navegador bloquear a busca de vozes, ele segue a vida com a padrão
      debugPrint("Erro ao buscar vozes avançadas: $e");
    }

    // Só trava a configuração como "pronta" se achou uma voz boa.
    // Se não achou (ex: navegador ainda não tinha carregado as vozes),
    // deixa em aberto para tentar de novo na próxima leitura.
    _vozConfigurada = vozPremiumEncontrada;
  }
}

// Essa função é o "Freio". Se o usuário clicar em outra tela ou botão, 
// o Flutter chama essa função e a voz corta na hora.
Future<void> pararVoz() async {
  await gerenciadorVoz.stop();
}
// ============================================================================
// BOTÃO GLOBAL DE ATIVAÇÃO (O ÍCONE DO CABEÇALHO)
// ============================================================================
class BotaoAcessibilidadeGlobal extends StatefulWidget {
  final String textoLeituraTela;
  
  // O 'acaoPersonalizada' é onde você passa a sequência tipo "livro" de cada tela
  final VoidCallback? acaoPersonalizada; 

  const BotaoAcessibilidadeGlobal({
    super.key, 
    required this.textoLeituraTela, 
    this.acaoPersonalizada,
  });

  @override
  State<BotaoAcessibilidadeGlobal> createState() => _BotaoAcessibilidadeGlobalState();
}

class _BotaoAcessibilidadeGlobalState extends State<BotaoAcessibilidadeGlobal> {
  
  @override
  void initState() {
    super.initState();
    // Se a acessibilidade já estiver ligada quando a tela abrir, ele começa a ler sozinho
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (acessibilidadeAtivada.value) {
        _iniciarLeituraDaTela();
      }
    });
  }

  Future<void> _iniciarLeituraDaTela() async {
    await pararVoz(); 
    await Future.delayed(const Duration(milliseconds: 300)); // <-- CORREÇÃO: Dá tempo para a transição de ecrã
    await configurarTts();
    
    if (widget.acaoPersonalizada != null) {
      // Aqui ele segue o "roteiro" programado para a tela específica
      widget.acaoPersonalizada!(); 
    } else if (widget.textoLeituraTela.isNotEmpty) {
      // Leitura de fallback simples
      await gerenciadorVoz.speak(widget.textoLeituraTela);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: acessibilidadeAtivada,
      builder: (context, ativo, child) {
        return IconButton(
          icon: Icon(
            ativo ? Icons.voice_over_off : Icons.record_voice_over,
            // Já utilizando as cores azuis da identidade visual que definimos
            color: ativo ? const Color(0xFF008BFF) : Colors.grey.shade600, 
            size: 28,
          ),
          onPressed: () async {
            await pararVoz(); 
            acessibilidadeAtivada.value = !ativo; 
            
            if (acessibilidadeAtivada.value) {
              await _iniciarLeituraDaTela();
            }
          },
        );
      },
    );
  }
}

// ============================================================================
// TEXTO ACESSÍVEL (A LEITURA PONTUAL E ESCONDIDA)
// ============================================================================
// ============================================================================
// TEXTO ACESSÍVEL (A LEITURA PONTUAL E ESCONDIDA)
// ============================================================================
class TextoAcessivel extends StatelessWidget {
  final String texto;
  
  // É NESTA VARIÁVEL QUE VOCÊ PASSA A FRASE ESCONDIDA!
  // Ex: textoOcultoParaLer: "Deseja ver essa escola? Ela oferece os benefícios..."
  final String? textoOcultoParaLer; 
  
  final TextStyle? estilo;
  final TextAlign alinhamento;
  final Color corIcone;
  
  // <-- NOVO: O interruptor do "Filho". Se for true, não desenha o botão de som.
  final bool ocultarIcone; 

  const TextoAcessivel({
    super.key, 
    required this.texto, 
    this.textoOcultoParaLer, 
    this.estilo,
    this.alinhamento = TextAlign.start,
    this.corIcone = const Color(0xFF0257A0), 
    this.ocultarIcone = false, // <-- NOVO: Padrão é falso para não quebrar o que já existe
  });

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: acessibilidadeAtivada,
      builder: (context, ativo, child) {
        
        // <-- MÁGICA AQUI: Se a acessibilidade estiver desligada OU for um elemento "Filho" (ocultarIcone = true)
        if (!ativo || ocultarIcone) {
          return Text(
            texto, 
            style: estilo, 
            textAlign: alinhamento,
          );
        }

        bool centralizado = alinhamento == TextAlign.center;
        return Row(
          mainAxisAlignment: centralizado ? MainAxisAlignment.center : MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (centralizado) const SizedBox(width: 40),
              
            Flexible(
              child: Text(
                texto, 
                style: estilo,
                textAlign: alinhamento,
              ),
            ),
            
            // O botão do alto-falante ao lado de textos específicos (Ex: "Benefícios")
            SizedBox(
              width: 40,
              child: IconButton(
                icon: Icon(
                  Icons.volume_up_rounded, 
                  color: corIcone, 
                  size: 24,
                ),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                onPressed: () async {
                  await pararVoz();
                  await Future.delayed(const Duration(milliseconds: 250)); // <-- CORREÇÃO: Desengasga a voz
                  await configurarTts();
                  await gerenciadorVoz.speak(textoOcultoParaLer ?? texto);
                },
              ),
            ),
          ],
        );
      },
    );
  }
}