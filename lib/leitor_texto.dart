import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:http/http.dart' as http;
import 'dart:typed_data';
import 'dart:async';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'dart:html' as html;

// ============================================================================
// ESTADO GLOBAL DA ACESSIBILIDADE E MOTOR DA AZURE
// ============================================================================
final ValueNotifier<bool> acessibilidadeAtivada = ValueNotifier<bool>(false);

// Mantemos o mesmo nome da variável antiga para não quebrar as outras telas!
final MotorVozAzure gerenciadorVoz = MotorVozAzure();

// Função mantida para compatibilidade com o código antigo (não faz nada agora)
Future<void> configurarTts() async {}

// O "Freio" de mão
Future<void> pararVoz() async {
  await gerenciadorVoz.stop();
}

// ============================================================================
// O NOVO MOTOR DE VOZ NEURAL (MICROSOFT AZURE)
// ============================================================================
// ============================================================================
// O NOVO MOTOR DE VOZ NEURAL (MICROSOFT AZURE)
// ============================================================================
// ============================================================================
// O NOVO MOTOR DE VOZ NEURAL (MICROSOFT AZURE)
// ============================================================================
// ============================================================================
// O NOVO MOTOR DE VOZ NEURAL (MICROSOFT AZURE)
// ============================================================================
class MotorVozAzure {
  final AudioPlayer _player = AudioPlayer();
  
  // A MÁGICA: Trocamos o 'final' por 'get'. Ele só abre o cofre na hora exata do clique!
  String get _apiKey => dotenv.env['AZURE_API_KEY'] ?? ""; 
  
  final String _regiao = "centralus";

  // A Fila de Espera Inteligente
  final List<String> _filaTextos = [];
  bool _processandoFila = false;
  Completer<void>? _completerAudio;

  // === ADICIONE ESTAS DUAS FUNÇÕES AQUI ===
  bool get isTocando => _processandoFila;

  Future<void> aguardarFilaTerminar() async {
    // Fica checando a cada 200 milissegundos se a voz já parou
    while (_processandoFila) {
      await Future.delayed(const Duration(milliseconds: 200));
    }
  }

  Future<void> speak(String texto) async {
    if (texto.isEmpty) return;

    // Limpeza do texto e formatação com a pausa humana <p>
    String textoLimpo = texto.replaceAll('&', 'e').replaceAll('<', '').replaceAll('>', '');
    String textoFormatado = "<p>${textoLimpo.replaceAll('\n', '</p><p>')}</p>";

    // Em vez de tocar na hora, coloca no fim da fila e avisa o motor
    _filaTextos.add(textoFormatado);
    _processarFila();
  }

  Future<void> _processarFila() async {
    // Se já tem um áudio tocando, não faz nada, apenas deixa na fila
    if (_processandoFila) return;
    _processandoFila = true;

    // Vai pegando o primeiro da fila e tocando até a fila esvaziar
    while (_filaTextos.isNotEmpty) {
      String textoAtual = _filaTextos.removeAt(0);

      try {
        final url = Uri.parse('https://$_regiao.tts.speech.microsoft.com/cognitiveservices/v1');
        final ssml = '''
          <speak version="1.0" xml:lang="pt-BR">
            <voice xml:lang="pt-BR" name="pt-BR-FranciscaNeural">
              <prosody rate="+5%">$textoAtual</prosody>
            </voice>
          </speak>
        ''';

        final resposta = await http.post(
          url,
          headers: {
            'Ocp-Apim-Subscription-Key': _apiKey,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
          },
          body: ssml,
        );

        if (resposta.statusCode == 200) {
          debugPrint("🔊 [ÁUDIO] ✅ Sucesso! Áudio gerado e tocando a fila...");
          final blob = html.Blob([resposta.bodyBytes], 'audio/mpeg');
          final blobUrl = html.Url.createObjectUrlFromBlob(blob);

          _completerAudio = Completer<void>();

          // Cria um sensor para avisar exatamente quando a música acabar
          StreamSubscription? sub = _player.onPlayerComplete.listen((_) {
            if (!_completerAudio!.isCompleted) _completerAudio!.complete();
          });

          await _player.play(UrlSource(blobUrl));

          // A MÁGICA: Trava o loop aqui até o áudio atual terminar de tocar!
          await _completerAudio!.future;

          sub.cancel(); // Limpa o sensor
        }
      } catch (e) {
        debugPrint("🚨 [ERRO ÁUDIO] Falha ao comunicar com a Azure: $e");
      }
    }

    // A fila esvaziou, o motor desliga e fica aguardando novos textos
    _processandoFila = false;
  }

  Future<void> stop() async {
    // 1. Jogamos fora tudo que estava na fila esperando
    _filaTextos.clear();
    
    // 2. ESCUDO PROTETOR WEB: Tenta parar o áudio, mas ignora se o navegador der erro
    try {
      await _player.stop();
    } catch (e) {
      debugPrint("Ignorando erro de stop no navegador Web: $e");
    }
    
    // 3. Destravamos o motor para ele não ficar preso para sempre
    if (_completerAudio != null && !_completerAudio!.isCompleted) {
      _completerAudio!.complete();
    }
    _processandoFila = false;
  }
}

// ============================================================================
// BOTÃO GLOBAL DE ATIVAÇÃO (O ÍCONE DO CABEÇALHO)
// ============================================================================
class BotaoAcessibilidadeGlobal extends StatefulWidget {
  final String textoLeituraTela;
  final VoidCallback? acaoPersonalizada;

  const BotaoAcessibilidadeGlobal({
    super.key,
    required this.textoLeituraTela,
    this.acaoPersonalizada,
  });

  @override
  State<BotaoAcessibilidadeGlobal> createState() =>
      _BotaoAcessibilidadeGlobalState();
}

class _BotaoAcessibilidadeGlobalState extends State<BotaoAcessibilidadeGlobal> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (acessibilidadeAtivada.value) {
        _iniciarLeituraDaTela();
      }
    });
  }

  Future<void> _iniciarLeituraDaTela() async {
    await pararVoz();
    await Future.delayed(const Duration(milliseconds: 300));

    if (widget.acaoPersonalizada != null) {
      widget.acaoPersonalizada!();
    } else if (widget.textoLeituraTela.isNotEmpty) {
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
class TextoAcessivel extends StatelessWidget {
  final String texto;
  final String? textoOcultoParaLer;
  final TextStyle? estilo;
  final TextAlign alinhamento;
  final Color corIcone;
  final bool ocultarIcone;

  const TextoAcessivel({
    super.key,
    required this.texto,
    this.textoOcultoParaLer,
    this.estilo,
    this.alinhamento = TextAlign.start,
    this.corIcone = const Color(0xFF0257A0),
    this.ocultarIcone = false,
  });

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: acessibilidadeAtivada,
      builder: (context, ativo, child) {
        if (!ativo || ocultarIcone) {
          return Text(texto, style: estilo, textAlign: alinhamento);
        }

        bool centralizado = alinhamento == TextAlign.center;
        return Row(
          mainAxisAlignment: centralizado
              ? MainAxisAlignment.center
              : MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (centralizado) const SizedBox(width: 40),

            Flexible(
              child: Text(texto, style: estilo, textAlign: alinhamento),
            ),

            SizedBox(
              width: 40,
              child: IconButton(
                icon: Icon(Icons.volume_up_rounded, color: corIcone, size: 24),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                onPressed: () async {
                  await pararVoz();
                  await Future.delayed(const Duration(milliseconds: 250));
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

// ============================================================================
// FUNÇÃO PARA LER TEXTO AO RETORNAR PARA UMA TELA
// ============================================================================
Future<void> falarAoVoltar(String mensagem) async {
  if (acessibilidadeAtivada.value) {
    // Espera a animação de voltar a tela terminar (meio segundo)
    await Future.delayed(const Duration(milliseconds: 500));
    await pararVoz();
    await gerenciadorVoz.speak(mensagem);
  }
}