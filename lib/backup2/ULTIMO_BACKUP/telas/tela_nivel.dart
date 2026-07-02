import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import 'package:geolocator/geolocator.dart'; 
import 'tela_home.dart';
import 'tela_abertura.dart'; 
import '../leitor_texto.dart';

class TelaNivel extends StatefulWidget {
  final Position? posicaoPreCarregada; 
  final List<dynamic>? dadosEscolas;
  
  const TelaNivel({
    super.key,
    required this.posicaoPreCarregada, 
    this.dadosEscolas,
  });

  @override
  State<TelaNivel> createState() => _TelaNivelState();
}

class _TelaNivelState extends State<TelaNivel> {

  @override
  void initState() {
    super.initState();
    _iniciarLeituraNivel();
  }

  void _iniciarLeituraNivel() async {
    await configurarTts();
    
    if (!mounted || !acessibilidadeAtivada.value) return;
    await gerenciadorVoz.speak(
      "De qual nível vamos continuar?"
    );
    
    if (!mounted || !acessibilidadeAtivada.value) return;
    await gerenciadorVoz.speak(
      "Opção 1: Ensino Fundamental. Ainda não terminei o nono ano."
    );
    
    if (!mounted || !acessibilidadeAtivada.value) return;
    await gerenciadorVoz.speak(
      "Opção 2: Ensino Médio. Já concluí o ensino fundamental, quero continuar o médio."
    );

    if (!mounted || !acessibilidadeAtivada.value) return;
    await gerenciadorVoz.speak(
      "Todas as escolas são gratuitas e possuem auxílios para que você consiga concluir com sucesso."
    );
  }

  @override
  void dispose() {
    pararVoz(); 
    super.dispose();
  }

  Widget _botaoNivel({
    required BuildContext context, 
    required String nivel, 
    required String subtitulo,
    required IconData icone, 
    required Color cor,
    required int delayMilissegundos,
  }) {
    return FadeInUp(
      delay: Duration(milliseconds: delayMilissegundos),
      duration: const Duration(milliseconds: 600),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white, 
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: const Color(0xFFEDE9FE), 
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF4F46E5).withOpacity(0.04), 
              blurRadius: 15, 
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(24),
            splashColor: const Color(0xFF7C3AED).withOpacity(0.1),
            highlightColor: const Color(0xFF7C3AED).withOpacity(0.05),
            onTap: () {
              pararVoz(); 
              Navigator.push(
                context, 
                MaterialPageRoute(
                  builder: (context) => TelaHome(
                    nivelEscolhido: nivel,
                    posicaoInjetada: widget.posicaoPreCarregada,
                    dadosBrutosEscolas: widget.dadosEscolas ?? [],
                  ),
                ),
              );
            },
            child: Padding(
              padding: const EdgeInsets.symmetric(
                vertical: 24, 
                horizontal: 20, 
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: const BoxDecoration(
                      color: Color(0xFFF0EEFF), 
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      icone, 
                      size: 28, 
                      color: cor,
                    ),
                  ),
                  const SizedBox(width: 16),
                  
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        TextoAcessivel(
                          texto: nivel,
                          estilo: GoogleFonts.inter(
                            fontSize: 20, 
                            fontWeight: FontWeight.w900, 
                            color: const Color(0xFF1E1B4B),
                          ),
                        ),
                        const SizedBox(height: 4),
                        TextoAcessivel(
                          texto: subtitulo,
                          estilo: GoogleFonts.inter(
                            fontSize: 15, 
                            fontWeight: FontWeight.w600, 
                            color: Colors.grey.shade500,
                            height: 1.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF7C3AED).withOpacity(0.05),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      "Escolher",
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF7C3AED), 
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F7FF), 
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          padding: const EdgeInsets.only(left: 16),
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05), 
                  blurRadius: 5,
                )
              ]
            ),
            child: const Icon(
              Icons.arrow_back_ios_new_rounded, 
              color: Color(0xFF7C3AED), 
              size: 18,
            ),
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
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 20),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05), 
                  blurRadius: 5,
                )
              ]
            ),
            child: BotaoAcessibilidadeGlobal(
              textoLeituraTela: "", 
              acaoPersonalizada: _iniciarLeituraNivel,
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight,
                ),
                child: IntrinsicHeight(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        
                        const Spacer(flex: 2),

                        // ============================================================================
                        // TÍTULO DA TELA
                        // ============================================================================
                        FadeInDown(
                          duration: const Duration(milliseconds: 600),
                          child: FittedBox(
                            fit: BoxFit.scaleDown, 
                            child: TextoAcessivel(
                              texto: 'De qual nível vamos continuar?',
                              alinhamento: TextAlign.center,
                              estilo: GoogleFonts.inter( 
                                fontWeight: FontWeight.w900, 
                                color: const Color(0xFF1E1B4B), 
                                fontSize: 30, 
                                letterSpacing: -1.0,
                              ),
                            ),
                          ),
                        ),
                        
                        const SizedBox(height: 45), 
                        
                        // ============================================================================
                        // OPÇÕES DE SELEÇÃO
                        // ============================================================================
                        _botaoNivel(
                          context: context, 
                          nivel: 'Ensino Fundamental', 
                          subtitulo: 'Ainda não terminei\no 9º ano', 
                          icone: Icons.menu_book_rounded, 
                          cor: const Color(0xFF7C3AED), 
                          delayMilissegundos: 800, 
                        ),
                        
                        // ESPAÇAMENTO AUMENTADO AQUI!
                        const SizedBox(height: 24), 
                        
                        _botaoNivel(
                          context: context, 
                          nivel: 'Ensino Médio', 
                          subtitulo: 'Já concluí o ensino fundamental,\nquero continuar o médio.', 
                          icone: Icons.school_rounded, 
                          cor: const Color(0xFF7C3AED), 
                          delayMilissegundos: 1000,
                        ),

                        const Spacer(flex: 3),

                        // ============================================================================
                        // RODAPÉ FIXADO NO FUNDO
                        // ============================================================================
                        FadeInUp(
                          delay: const Duration(milliseconds: 1200),
                          duration: const Duration(milliseconds: 800),
                          child: Column(
                            children: [
                              Opacity(
                                opacity: 0.5,
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: const [
                                    Icon(Icons.volunteer_activism_rounded, color: Color(0xFF7C3AED), size: 24),
                                    SizedBox(width: 8),
                                    Icon(Icons.directions_bus_rounded, color: Color(0xFF7C3AED), size: 24),
                                    SizedBox(width: 8),
                                    Icon(Icons.restaurant_rounded, color: Color(0xFF7C3AED), size: 24),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 16),
                              
                              Semantics(
                                label: 'Todas as escolas são gratuitas e possuem auxílios para que você consiga concluir com sucesso.',
                                child: Text.rich(
                                  TextSpan(
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w500,
                                      color: Colors.grey.shade500,
                                      height: 1.5,
                                    ),
                                    children: [
                                      const TextSpan(text: 'Todas as escolas são '),
                                      TextSpan(
                                        text: 'gratuitas',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: const Color(0xFF7C3AED), 
                                        ),
                                      ),
                                      const TextSpan(text: ' e possuem '),
                                      TextSpan(
                                        text: 'auxílios\n', 
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: const Color(0xFF7C3AED), 
                                        ),
                                      ),
                                      const TextSpan(text: 'para que você consiga concluir com sucesso.'),
                                    ],
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 30), 
                      ],
                    ),
                  ),
                ),
              ),
            );
          }
        ),
      ),
    );
  }
}