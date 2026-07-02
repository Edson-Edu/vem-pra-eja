import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
// Import necessário

final ValueNotifier<bool> acessibilidadeAtivada = ValueNotifier<bool>(false);

final FlutterTts gerenciadorVoz = FlutterTts();
bool _vozConfigurada = false;

Future<void> configurarTts() async {
  if (!_vozConfigurada) {
    await gerenciadorVoz.setLanguage(
      "pt-BR",
    );
    await gerenciadorVoz.setSpeechRate(
      0.5,
    );
    await gerenciadorVoz.awaitSpeakCompletion(
      true,
    );
    _vozConfigurada = true;
  }
}

void pararVoz() {
  gerenciadorVoz.stop();
}

class BotaoAcessibilidadeGlobal extends StatefulWidget {
  final String textoLeituraTela;
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
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (acessibilidadeAtivada.value) {
        if (widget.acaoPersonalizada != null) {
          widget.acaoPersonalizada!();
        } else if (widget.textoLeituraTela.isNotEmpty) {
          _falarAutomaticamente();
        }
      }
    });
  }

  Future<void> _falarAutomaticamente() async {
    pararVoz(); 
    await configurarTts();
    await gerenciadorVoz.speak(
      widget.textoLeituraTela,
    );
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: acessibilidadeAtivada,
      builder: (context, ativo, child) {
        return IconButton(
          icon: Icon(
            ativo 
                ? Icons.voice_over_off 
                : Icons.record_voice_over,
            // COR ÍNDIGO PARA ÍCONE ATIVO
            color: ativo 
                ? const Color(0xFF3F51B5) 
                : Colors.grey.shade600,
            size: 28,
          ),
          onPressed: () async {
            pararVoz(); 
            acessibilidadeAtivada.value = !ativo; 
            
            if (acessibilidadeAtivada.value) {
              if (widget.acaoPersonalizada != null) {
                widget.acaoPersonalizada!(); 
              } else {
                await configurarTts();
                await gerenciadorVoz.speak(
                  widget.textoLeituraTela,
                ); 
              }
            }
          },
        );
      },
    );
  }
}

class TextoAcessivel extends StatelessWidget {
  final String texto;
  final String? textoOcultoParaLer; 
  final TextStyle? estilo;
  final TextAlign alinhamento;
  final Color corIcone;

  const TextoAcessivel({
    super.key, 
    required this.texto, 
    this.textoOcultoParaLer,
    this.estilo,
    this.alinhamento = TextAlign.start,
    // ÍNDIGO PARA ÍCONE DE SOM
    this.corIcone = const Color(
      0xFF3F51B5,
    ),
  });

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: acessibilidadeAtivada,
      builder: (context, ativo, child) {
        
        if (!ativo) {
          return Text(
            texto, 
            style: estilo, // Usa a Inter definida no main
            textAlign: alinhamento,
          );
        }

        bool centralizado = alinhamento == TextAlign.center;
        return Row(
          mainAxisAlignment: centralizado 
              ? MainAxisAlignment.center 
              : MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (centralizado) 
              const SizedBox(
                width: 40,
              ),
              
            Flexible(
              child: Text(
                texto, 
                style: estilo, // Usa a Inter definida no main
                textAlign: alinhamento,
              ),
            ),
            
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
                  pararVoz();
                  await configurarTts();
                  await gerenciadorVoz.speak(
                    textoOcultoParaLer ?? texto,
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }
}