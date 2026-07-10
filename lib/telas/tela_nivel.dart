import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import 'package:geolocator/geolocator.dart';
import 'tela_home.dart';
import 'tela_abertura.dart';
import '../paleta.dart';
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
    await gerenciadorVoz.speak("Até que série ou ano você estudou?");

    if (!mounted || !acessibilidadeAtivada.value) return;
    await gerenciadorVoz.speak(
      "Opção 1: Nunca estudei. Não cheguei a frequentar a escola formalmente.",
    );

    if (!mounted || !acessibilidadeAtivada.value) return;
    await gerenciadorVoz.speak(
      "Opção 2: Ensino Fundamental, antigo primeiro grau. Inclui o primário e o ginásio.",
    );

    if (!mounted || !acessibilidadeAtivada.value) return;
    await gerenciadorVoz.speak(
      "Opção 3: Ensino Médio, antigo segundo grau. Para quem já concluiu o fundamental e quer continuar os estudos.",
    );

    if (!mounted || !acessibilidadeAtivada.value) return;
    await gerenciadorVoz.speak(
      "Lembrando que todas as escolas são gratuitas e possuem auxílios para que você consiga concluir com sucesso.",
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
    String? textoOcultoNivel,
    required String nivelFiltro,
    required String subtitulo,
    String? textoOcultoSubtitulo,
    required IconData icone,
    required Color cor,
    required int delayMilissegundos,
  }) {
    return FadeInUp(
      delay: Duration(milliseconds: delayMilissegundos),
      duration: const Duration(milliseconds: 600),
      child: Container(
        decoration: BoxDecoration(
          color: Paleta.cardBranco,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.grey.shade300, width: 1.5),
          boxShadow: [
            BoxShadow(
             color: Paleta.azulPrincipal.withValues(alpha: 0.04),
              blurRadius: 15,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(24),
            splashColor: Paleta.azulBotao.withValues(alpha: 0.1),
            highlightColor: Paleta.azulBotao.withValues(alpha: 0.05),
            onTap: () {
              pararVoz();
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => TelaHome(
                    nivelEscolhido: nivelFiltro,
                    posicaoInjetada: widget.posicaoPreCarregada,
                    dadosBrutosEscolas: widget.dadosEscolas ?? [],
                  ),
                ),
              );
            },
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Paleta.azulIcones.withValues(alpha: 0.1), // <-- NOVO
                      shape: BoxShape.circle,
                    ),
                    child: Icon(icone, size: 28, color: cor),
                  ),
                  const SizedBox(width: 16),

                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // ESSE É O PAI (Lê o título e o subtítulo de uma vez só)
                        TextoAcessivel(
                          texto: nivel,
                          textoOcultoParaLer: "${textoOcultoNivel ?? nivel}. ${textoOcultoSubtitulo ?? subtitulo}",
                          estilo: GoogleFonts.inter(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: Paleta.textoDestaque, // <-- Independente do fundo da abertura!
                          ),
                        ),
                        const SizedBox(height: 4),
                        
                        // ESSE É O FILHO (Liga a invisibilidade do ícone para não quebrar o layout)
                        TextoAcessivel(
                          texto: subtitulo,
                          ocultarIcone: true, 
                          estilo: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: Paleta.textoDestaque.withValues(alpha: 0.7), // <-- Independente também
                            height: 1.3,
                          ),
                        ),
                      ],
                    ),
                  ),

                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Paleta.azulBotao.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      "Escolher",
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Paleta.azulBotao,
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
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Paleta.fundoGeral, // <-- NOVO
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          padding: const EdgeInsets.only(left: 16),
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Paleta.cardBranco, // <-- NOVO
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 5,
                ),
              ],
            ),
            child: const Icon(
              Icons.arrow_back_ios_new_rounded,
              color: Paleta.azulIcones, // <-- NOVO
              size: 18,
            ),
          ),
          onPressed: () {
            pararVoz();
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => const TelaAbertura()),
            );
          },
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 20),
            decoration: BoxDecoration(
              color: Paleta.cardBranco, // <-- NOVO
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 5,
                ),
              ],
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
                constraints: BoxConstraints(minHeight: constraints.maxHeight),
                child: IntrinsicHeight(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Spacer(flex: 2),

                        // ============================================================================
                        // TÍTULO DO ECRÃ
                        // ============================================================================
                        FadeInDown(
                          duration: const Duration(milliseconds: 600),
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            child: TextoAcessivel(
                              texto: 'Até que série/ano você estudou?',
                              alinhamento: TextAlign.center,
                              estilo: GoogleFonts.inter(
                                fontWeight: FontWeight.w900,
                                color: Paleta.textoPrincipal, // <-- NOVO
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
                          nivel: 'Nunca estudei',
                          textoOcultoNivel: 'Opção 1: Nunca estudei',
                          nivelFiltro: 'Ensino Fundamental',
                          subtitulo: 'Não cheguei a frequentar a escola formalmente.',
                          textoOcultoSubtitulo: 'Toque aqui para escolher se você não chegou a frequentar a escola formalmente.',
                          icone: Icons.menu_book_rounded,
                          cor: Paleta.azulIcones, 
                          delayMilissegundos: 800,
                        ),
                        const SizedBox(height: 24),

                        _botaoNivel(
                          context: context,
                          nivel: 'Ensino Fundamental (1º Grau)',
                          textoOcultoNivel: 'Opção 2: Ensino Fundamental, o antigo primeiro grau.',
                          nivelFiltro: 'Ensino Fundamental',
                          subtitulo: 'Inclui do 1º ao 5º ano (antigo Primário) e do 6º ao 9º ano (antigo Ginásio).',
                          textoOcultoSubtitulo: 'Inclui do primeiro ao quinto ano, antigo primário, e do sexto ao nono ano, antigo ginásio. Toque para escolher.',
                          icone: Icons.menu_book_rounded,
                          cor: Paleta.azulIcones, 
                          delayMilissegundos: 800,
                        ),

                        const SizedBox(height: 24),

                       _botaoNivel(
                          context: context,
                          nivel: 'Ensino Médio (2º Grau)',
                          textoOcultoNivel: 'Opção 3: Ensino Médio, o antigo segundo grau.',
                          nivelFiltro: 'Ensino Médio',
                          subtitulo: 'Já conclui o Ensino Fundamental(1º grau/ginásio) e quero continuar os estudos no Ensino Medio(antigo Colegial).',
                          textoOcultoSubtitulo: 'Para quem já concluiu o Ensino Fundamental, o antigo ginásio, e quer continuar os estudos no Ensino Médio, o antigo colegial. Toque para escolher.',
                          icone: Icons.school_rounded,
                          cor: Paleta.azulIcones, 
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
                                    Icon(
                                      Icons.volunteer_activism_rounded,
                                      color: Paleta.azulIcones, // <-- NOVO
                                      size: 24,
                                    ),
                                    SizedBox(width: 8),
                                    Icon(
                                      Icons.directions_bus_rounded,
                                      color: Paleta.azulIcones, // <-- NOVO
                                      size: 24,
                                    ),
                                    SizedBox(width: 8),
                                    Icon(
                                      Icons.restaurant_rounded,
                                      color: Paleta.azulIcones, // <-- NOVO
                                      size: 24,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 16),

                              Semantics(
                                label:
                                    'Todas as escolas são gratuitas e possuem auxílios para que você consiga concluir com sucesso.',
                                child: Text.rich(
                                  TextSpan(
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w500,
                                      color: Paleta.textoSecundario, // <-- NOVO
                                      height: 1.5,
                                    ),
                                    children: [
                                      const TextSpan(
                                        text: 'Todas as escolas são ',
                                      ),
                                      TextSpan(
                                        text: 'gratuitas',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: Paleta.azulBotao, // <-- NOVO
                                        ),
                                      ),
                                      const TextSpan(text: ' e possuem '),
                                      TextSpan(
                                        text: 'auxílios\n',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: Paleta.azulBotao, // <-- NOVO
                                        ),
                                      ),
                                      const TextSpan(
                                        text:
                                            'para que você consiga concluir com sucesso.',
                                      ),
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
          },
        ),
      ),
    );
  }
}

