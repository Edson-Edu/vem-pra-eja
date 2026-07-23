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
    // Dá 600 milissegundos para a animação da tela nova terminar de abrir com calma
    await Future.delayed(const Duration(milliseconds: 600));

    await pararVoz(); // Garante que a fila está limpa
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

  // ============================================================================
  // WIDGET CONSTRUTOR DOS BOTÕES DE SELEÇÃO (ESCALÁVEL E RESPONSIVO)
  // ============================================================================
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
    bool usarLayoutComputador = false,
    double escalaMestre = 1.0,
  }) {
    final cardWidget = Container(
      width: usarLayoutComputador
          ? 310
          : double.infinity, // Caixas compactadas estáveis
      height: usarLayoutComputador
          ? 240
          : null, // Mesma altura idêntica para Desktop
      decoration: BoxDecoration(
        color: Paleta.cardBranco,
        borderRadius: BorderRadius.circular(24 * escalaMestre),
        border: Border.all(
          color: Colors.grey.shade300,
          width: 1.5 * escalaMestre,
        ),
        boxShadow: [
          BoxShadow(
            color: Paleta.azulPrincipal.withValues(alpha: 0.04),
            blurRadius: 15 * escalaMestre,
            offset: Offset(0, 5 * escalaMestre),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(24 * escalaMestre),
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
            ).then(
              (_) => falarAoVoltar(
                "Voltamos para a tela de níveis. Escolha um nível para continuar.",
              ),
            );
          },
          child: Padding(
            padding: EdgeInsets.all(
              usarLayoutComputador ? 24 : (24 * escalaMestre),
            ),
            child: usarLayoutComputador
                ? Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Paleta.azulIcones.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(icone, size: 26, color: cor),
                          ),
                          _buildBotaoEscolher(escalaMestre),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            TextoAcessivel(
                              texto: nivel,
                              textoOcultoParaLer:
                                  "${textoOcultoNivel ?? nivel}. ${textoOcultoSubtitulo ?? subtitulo}",
                              estilo: GoogleFonts.inter(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                color: Paleta.textoDestaque,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Expanded(
                              child: Text(
                                subtitulo,
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: Paleta.textoDestaque.withValues(
                                    alpha: 0.75,
                                  ),
                                  height: 1.3,
                                ),
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  )
                : Row(
                    children: [
                      Container(
                        padding: EdgeInsets.all(16 * escalaMestre),
                        decoration: BoxDecoration(
                          color: Paleta.azulIcones.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(icone, size: 28 * escalaMestre, color: cor),
                      ),
                      SizedBox(width: 16 * escalaMestre),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            TextoAcessivel(
                              texto: nivel,
                              textoOcultoParaLer:
                                  "${textoOcultoNivel ?? nivel}. ${textoOcultoSubtitulo ?? subtitulo}",
                              estilo: GoogleFonts.inter(
                                fontSize: 18 * escalaMestre,
                                fontWeight: FontWeight.w900,
                                color: Paleta.textoDestaque,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              subtitulo,
                              style: GoogleFonts.inter(
                                fontSize: 14 * escalaMestre,
                                fontWeight: FontWeight.w600,
                                color: Paleta.textoDestaque.withValues(
                                  alpha: 0.7,
                                ),
                                height: 1.3,
                              ),
                            ),
                          ],
                        ),
                      ),
                      SizedBox(width: 12 * escalaMestre),
                      _buildBotaoEscolher(escalaMestre),
                    ],
                  ),
          ),
        ),
      ),
    );

    // FIX DEFINITIVO: O return foi recolocado envolvendo a animação do card!
    return FadeInUp(
      delay: Duration(milliseconds: delayMilissegundos),
      duration: const Duration(milliseconds: 600),
      child: cardWidget,
    );
  }

  Widget _buildBotaoEscolher(double escala) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: 10 * escala,
        vertical: 6 * escala,
      ),
      decoration: BoxDecoration(
        color: Paleta.azulBotao.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        "Escolher",
        style: GoogleFonts.inter(
          fontSize: 12 * escala,
          fontWeight: FontWeight.bold,
          color: Paleta.azulBotao,
        ),
      ),
    );
  }

  // ============================================================================
  // PALCO PRINCIPAL DA INTERFACE (MÉTODO BUILD)
  // ============================================================================
  @override
  Widget build(BuildContext context) {
    final Size screenSize = MediaQuery.of(context).size;
    final targetPlatform = Theme.of(context).platform;
    final bool isDispositivoMovel =
        targetPlatform == TargetPlatform.android ||
        targetPlatform == TargetPlatform.iOS;

    final bool ehTabletReal =
        isDispositivoMovel && screenSize.shortestSide >= 600;
    final bool ehTelaGrandeComputador =
        !isDispositivoMovel && screenSize.width > 1280;
    double escalaDinamica = ehTabletReal ? 1.6 : 1.0;
    double larguraMaximaContainer = ehTelaGrandeComputador
        ? 1200
        : (ehTabletReal ? 850 : 500);

    return Scaffold(
      backgroundColor: Paleta.fundoGeral,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        toolbarHeight: ehTabletReal ? 120 : 80,
        leadingWidth: ehTabletReal ? 110 : 90,
        leading: Center(
          child: SizedBox(
            width: ehTabletReal ? 70 : 45,
            height: ehTabletReal ? 70 : 45,
            child: IconButton(
              padding: EdgeInsets.zero,
              icon: Container(
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Paleta.cardBranco,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.08),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Icon(
                  Icons.arrow_back_ios_new_rounded,
                  color: Paleta.azulIcones,
                  size: ehTabletReal ? 32 : 22,
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
          ),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 24),
            width: ehTabletReal ? 70 : 44,
            height: ehTabletReal ? 70 : 44,
            decoration: BoxDecoration(
              color: Paleta.cardBranco,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
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
              child: Center(
                child: Container(
                  constraints: BoxConstraints(
                    maxWidth: larguraMaximaContainer,
                    minHeight:
                        constraints.maxHeight -
                        (ehTabletReal
                            ? 40
                            : 24), // Garante altura total para o espaçamento funcionar
                  ),
                  padding: EdgeInsets.symmetric(
                    horizontal: 24.0,
                    vertical: ehTabletReal ? 20 : 12,
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment
                        .spaceBetween, // Distribui o espaço entre o topo, o meio e o fim!
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // ============================================================================
                      // TÍTULO DO ECRÃ
                      // ============================================================================
                      Column(
                        children: [
                          const SizedBox(height: 10),
                          FadeInDown(
                            duration: const Duration(milliseconds: 600),
                            child: FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Text(
                                'Até que série/ano você estudou?',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.w900,
                                  color: Paleta.textoPrincipal,
                                  fontSize: ehTelaGrandeComputador
                                      ? 38
                                      : (ehTabletReal ? 34 : 26),
                                  letterSpacing: -1.0,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),

                      // 2. MEIO (Botões de Nível)
                      Padding(
                        padding: EdgeInsets.symmetric(
                          vertical: ehTabletReal ? 20 : 10,
                        ),
                        child: ehTelaGrandeComputador
                            ? Wrap(
                                spacing: 30,
                                runSpacing: 24,
                                alignment: WrapAlignment.center,
                                children: [
                                  _botaoNivel(
                                    context: context,
                                    nivel: 'Nunca estudei',
                                    textoOcultoNivel: 'Opção 1: Nunca estudei',
                                    nivelFiltro: 'Ensino Fundamental',
                                    subtitulo:
                                        'Não cheguei a frequentar a escola formalmente.',
                                    textoOcultoSubtitulo:
                                        'Toque aqui para escolher se você não chegou a frequentar a escola formalmente.',
                                    icone: Icons.menu_book_rounded,
                                    cor: Paleta.azulIcones,
                                    delayMilissegundos: 600,
                                    usarLayoutComputador: true,
                                  ),
                                  _botaoNivel(
                                    context: context,
                                    nivel: 'Ensino Fundamental (1º Grau)',
                                    textoOcultoNivel:
                                        'Opção 2: Ensino Fundamental, o antigo primeiro grau.',
                                    nivelFiltro: 'Ensino Fundamental',
                                    subtitulo:
                                        'Inclui do 1º ao 5º ano (antigo Primário) e do 6º ao 9º ano (antigo Ginásio).',
                                    textoOcultoSubtitulo:
                                        'Inclui do primeiro ao quinto ano, antigo primário, e do sexto ao nono ano, antigo ginásio. Toque para escolher.',
                                    icone: Icons.menu_book_rounded,
                                    cor: Paleta.azulIcones,
                                    delayMilissegundos: 800,
                                    usarLayoutComputador: true,
                                  ),
                                  _botaoNivel(
                                    context: context,
                                    nivel: 'Ensino Médio (2º Grau)',
                                    textoOcultoNivel:
                                        'Opção 3: Ensino Médio, o antigo segundo grau.',
                                    nivelFiltro: 'Ensino Médio',
                                    subtitulo:
                                        'Já conclui o Ensino Fundamental(1º grau/ginásio) e quero continuar os estudos no Ensino Medio(antigo Colegial).',
                                    textoOcultoSubtitulo:
                                        'Para quem já concluiu o Ensino Fundamental, o antigo ginásio, e quer continuar os estudos no Ensino Médio, o antigo colegial. Toque para escolher.',
                                    icone: Icons.school_rounded,
                                    cor: Paleta.azulIcones,
                                    delayMilissegundos: 1000,
                                    usarLayoutComputador: true,
                                  ),
                                ],
                              )
                            : Column(
                                children: [
                                  _botaoNivel(
                                    context: context,
                                    nivel: 'Nunca estudei',
                                    textoOcultoNivel: 'Opção 1: Nunca estudei',
                                    nivelFiltro: 'Ensino Fundamental',
                                    subtitulo:
                                        'Não cheguei a frequentar a escola formalmente.',
                                    textoOcultoSubtitulo:
                                        'Toque aqui para escolher se você não chegou a frequentar a escola formalmente.',
                                    icone: Icons.menu_book_rounded,
                                    cor: Paleta.azulIcones,
                                    delayMilissegundos: 600,
                                    escalaMestre: escalaDinamica,
                                  ),
                                  SizedBox(height: ehTabletReal ? 20 : 16),
                                  _botaoNivel(
                                    context: context,
                                    nivel: 'Ensino Fundamental (1º Grau)',
                                    textoOcultoNivel:
                                        'Opção 2: Ensino Fundamental, o antigo primeiro grau.',
                                    nivelFiltro: 'Ensino Fundamental',
                                    subtitulo:
                                        'Inclui do 1º ao 5º ano (antigo Primário) e do 6º ao 9º ano (antigo Ginásio).',
                                    textoOcultoSubtitulo:
                                        'Inclui do primeiro ao quinto ano, antigo primário, e do sexto ao nono ano, antigo ginásio. Toque para escolher.',
                                    icone: Icons.menu_book_rounded,
                                    cor: Paleta.azulIcones,
                                    delayMilissegundos: 800,
                                    escalaMestre: escalaDinamica,
                                  ),
                                  SizedBox(height: ehTabletReal ? 20 : 16),
                                  _botaoNivel(
                                    context: context,
                                    nivel: 'Ensino Médio (2º Grau)',
                                    textoOcultoNivel:
                                        'Opção 3: Ensino Médio, o antigo segundo grau.',
                                    nivelFiltro: 'Ensino Médio',
                                    subtitulo:
                                        'Já conclui o Ensino Fundamental(1º grau/ginásio) e quero continuar os estudos no Ensino Medio(antigo Colegial).',
                                    textoOcultoSubtitulo:
                                        'Para quem já concluiu o Ensino Fundamental, o antigo ginásio, e quer continuar os estudos no Ensino Médio, o antigo colegial. Toque para escolher.',
                                    icone: Icons.school_rounded,
                                    cor: Paleta.azulIcones,
                                    delayMilissegundos: 1000,
                                    escalaMestre: escalaDinamica,
                                  ),
                                ],
                              ),
                      ),
                      // 3. FIM (Rodapé bem posicionado e desgrudado)
                      FadeInUp(
                        delay: const Duration(milliseconds: 1200),
                        duration: const Duration(milliseconds: 800),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Opacity(
                              opacity: 0.5,
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.volunteer_activism_rounded,
                                    color: Paleta.azulIcones,
                                    size: 26,
                                  ),
                                  const SizedBox(width: 10),
                                  Icon(
                                    Icons.directions_bus_rounded,
                                    color: Paleta.azulIcones,
                                    size: 26,
                                  ),
                                  const SizedBox(width: 10),
                                  Icon(
                                    Icons.restaurant_rounded,
                                    color: Paleta.azulIcones,
                                    size: 26,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 12),
                            Semantics(
                              label:
                                  'Todas as escolas são gratuitas e possuem auxílios.',
                              child: Text.rich(
                                TextSpan(
                                  style: GoogleFonts.inter(
                                    fontSize: ehTabletReal ? 15 : 14,
                                    fontWeight: FontWeight.w500,
                                    color: Paleta.textoSecundario,
                                    height: 1.5,
                                  ),
                                  children: const [
                                    TextSpan(text: 'Todas as escolas são '),
                                    TextSpan(
                                      text: 'gratuitas',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: Colors.blue,
                                      ),
                                    ),
                                    TextSpan(text: ' e possuem '),
                                    TextSpan(
                                      text: 'auxílios\n',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: Colors.blue,
                                      ),
                                    ),
                                    TextSpan(
                                      text:
                                          'para que você consiga concluir com sucesso.',
                                    ),
                                  ],
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                            const SizedBox(height: 10), // Respiro final seguro
                          ],
                        ),
                      ),
                    ],
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
