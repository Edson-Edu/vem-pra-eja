import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import 'package:geolocator/geolocator.dart'; // Import necessário
import 'tela_home.dart';
import 'tela_abertura.dart'; 
import '../leitor_texto.dart';

class TelaNivel extends StatefulWidget {
  // Passagem obrigatória da localização
  final Position? posicaoPreCarregada; 

  const TelaNivel({
    super.key,
    required this.posicaoPreCarregada, // Recebe da Splash
  });

  @override
  State<TelaNivel> createState() => _TelaNivelState();
}

class _TelaNivelState extends State<TelaNivel> {

  @override
  void dispose() {
    pararVoz(); 
    super.dispose();
  }

  Widget _botaoNivel(
    BuildContext context, 
    String nivel, 
    IconData icone, 
    Color cor,
  ) {
    return FadeInUp(
      child: InkWell(
        onTap: () {
          pararVoz(); 
          Navigator.push(
            context, 
            MaterialPageRoute(
              builder: (context) => TelaHome(
                nivelEscolhido: nivel,
                // MÁGICA: Passa o GPS pré-carregado para a Home
                posicaoInjetada: widget.posicaoPreCarregada,
              ),
            ),
          );
        },
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(
            vertical: 20, 
            horizontal: 16,
          ),
          decoration: BoxDecoration(
            color: Colors.white, 
            borderRadius: BorderRadius.circular(
              20,
            ),
            border: Border.all(
              color: cor.withOpacity(0.3), 
              width: 2,
            ),
            boxShadow: const [
              BoxShadow(
                color: Colors.black12, 
                blurRadius: 10, 
                offset: Offset(0, 5),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(
                  12,
                ),
                decoration: BoxDecoration(
                  color: cor.withOpacity(0.1), 
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  icone, 
                  size: 36, 
                  color: cor,
                ),
              ),
              const SizedBox(
                width: 15,
              ),
              Expanded(
                child: TextoAcessivel(
                  texto: nivel,
                  estilo: GoogleFonts.inter( // Fonte Inter
                    fontSize: 18, 
                    fontWeight: FontWeight.bold, 
                    color: const Color(0xFF455A64),
                  ),
                ),
              ),
              Icon(
                Icons.arrow_forward_ios_rounded, // Ícone arredondado moderno
                color: Colors.grey.shade400,
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_rounded, 
            color: Color(0xFF3F51B5), // Índigo Back
          ),
          onPressed: () {
            pararVoz(); 
            Navigator.pushReplacement(
              context, 
              MaterialPageRoute(
                builder: (context) => const TelaAbertura(),
              ),
            );
          },
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: const [
          BotaoAcessibilidadeGlobal(
            textoLeituraTela: "Qual nível de ensino você precisa concluir? Escolha abaixo entre Ensino Fundamental e Ensino Médio.",
          ),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: 24.0,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  TextoAcessivel(
                    texto: 'Qual nível de ensino você precisa concluir?',
                    alinhamento: TextAlign.center,
                    estilo: GoogleFonts.inter( // Fonte Inter Moderno
                      fontWeight: FontWeight.w900, 
                      color: const Color(0xFF3F51B5), // Índigo Título
                      fontSize: 26,
                      letterSpacing: -1.0,
                    ),
                  ),
                  const SizedBox(
                    height: 40,
                  ),
                  
                  _botaoNivel(
                    context, 
                    'Ensino Fundamental', 
                    Icons.menu_book_rounded, 
                    const Color(0xFF3F51B5), // Índigo Confiança
                  ),
                  const SizedBox(
                    height: 30,
                  ),
                  
                  _botaoNivel(
                    context, 
                    'Ensino Médio', 
                    Icons.school_rounded, 
                    const Color(0xFFFF9800), // NOVO ÂMBAR - ENERGIA (Substituiu vermelho/verde)
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}