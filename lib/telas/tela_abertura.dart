import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';
import '../leitor_texto.dart';
import 'tela_nivel.dart';
import 'manutencao.dart';
import '../paleta.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

// ============================================================================
// TELA DE ABERTURA - VEM PRA EJA
// Conceito Visual: Tipografia Robusta (Archivo Black) e Design Minimalista
// ============================================================================
class TelaAbertura extends StatefulWidget {
  const TelaAbertura({super.key});

  @override
  State<TelaAbertura> createState() => _TelaAberturaState();
}

class _TelaAberturaState extends State<TelaAbertura>
    with TickerProviderStateMixin {
  // --------------------------------------------------------------------------
  // VARIÁVEIS DE ESTADO E DADOS BACKEND
  // --------------------------------------------------------------------------
  Position? _posicaoInicialCarregada;
  List<dynamic> _dadosSupabase = [];

  // --------------------------------------------------------------------------
  // CONTROLADORES DE ANIMAÇÃO (A Coreografia Tipográfica)
  // --------------------------------------------------------------------------

  // 1. Texto "VEM" (Fade suave)
  late AnimationController _ctrlVem;
  late Animation<double> _animVemOpacity;
  late Animation<Offset> _animVemSlide;

  // 2. Pílula "[PRA]" (Pulo/Scale elástico)
  late AnimationController _ctrlPra;
  late Animation<double> _animPraScale;
  late Animation<double> _animPraOpacity;

  // 3. Texto gigante "EJA" (Slide de baixo para cima)
  late AnimationController _ctrlEja;
  late Animation<double> _animEjaOpacity;
  late Animation<Offset> _animEjaSlide;

  // 4. Efeito Shimmer (O brilho premium varrendo a logo "EJA")
  late AnimationController _ctrlShimmer;
  late Animation<double> _animShimmer;

  // 5. Barrinha e Texto de Carregamento no rodapé
  late AnimationController _ctrlLoader;
  late Animation<double> _animLoaderFade;
  late Animation<double> _animLoaderProgresso;

  // 6. Fade Final da Tela inteira antes de mudar de página
  late AnimationController _ctrlFadeTelaFinal;
  late Animation<double> _animFadeTelaFinal;

  // === NOVO: 7. Dica de Acessibilidade (Tooltip Animado) ===
  late AnimationController _ctrlTooltip;
  late Animation<double> _animTooltipOpacity;
  late Animation<Offset> _animTooltipSlide;
  // --------------------------------------------------------------------------
  // CONFIGURAÇÃO INICIAL (INIT)
  // --------------------------------------------------------------------------
  @override
  void initState() {
    super.initState();

    // Trava a tela na vertical para não quebrar a imersão da abertura
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);

    // Prepara todos os motores de animação
    _configurarAnimacoes();

    // Inicia a função mestre que sincroniza o GPS, Supabase e a Animação
    _iniciarAppSincronizado();
  }

  // --------------------------------------------------------------------------
  // CONFIGURAÇÃO DE TODOS OS TIMERS E CURVAS DAS ANIMAÇÕES
  // --------------------------------------------------------------------------
  void _configurarAnimacoes() {
    // Animação 1: "VEM"
    _ctrlVem = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _animVemOpacity = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _ctrlVem, curve: Curves.easeOut));
    _animVemSlide = Tween<Offset>(
      begin: const Offset(0, 0.2),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _ctrlVem, curve: Curves.easeOutCubic));

    // Animação 2: "[PRA]" (A pílula surge com um "quique")
    _ctrlPra = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _animPraScale = Tween<double>(
      begin: 0.5,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _ctrlPra, curve: Curves.easeOutBack));
    _animPraOpacity = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _ctrlPra, curve: Curves.easeIn));

    // Animação 3: "EJA" Gigante
    _ctrlEja = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _animEjaOpacity = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _ctrlEja, curve: Curves.easeOut));
    _animEjaSlide = Tween<Offset>(
      begin: const Offset(0, 0.15),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _ctrlEja, curve: Curves.easeOutCubic));

    // Animação 4: O brilho metálico varrendo a logo
    _ctrlShimmer = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _animShimmer = Tween<double>(
      begin: -1.0,
      end: 2.0,
    ).animate(CurvedAnimation(parent: _ctrlShimmer, curve: Curves.easeInOut));

    // Animação 5: Barrinha de Carregamento e Texto
    _ctrlLoader = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _animLoaderFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _ctrlLoader,
        curve: const Interval(0.0, 0.3, curve: Curves.easeIn),
      ),
    );
    // A barrinha vai ficar animando infinitamente de um lado pro outro
    _animLoaderProgresso = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _ctrlLoader, curve: Curves.easeInOutSine),
    );

    // Animação 6: O Fade de saída final antes de ir para a próxima tela
    _ctrlFadeTelaFinal = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _animFadeTelaFinal = Tween<double>(begin: 1.0, end: 0.0).animate(
      CurvedAnimation(parent: _ctrlFadeTelaFinal, curve: Curves.easeIn),
    );

    // Animação 7: Tooltip de Acessibilidade (Surge da direita para a esquerda)
    _ctrlTooltip = AnimationController(vsync: this, duration: const Duration(milliseconds: 800));
    _animTooltipOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(CurvedAnimation(parent: _ctrlTooltip, curve: Curves.easeOut));
    _animTooltipSlide = Tween<Offset>(begin: const Offset(0.5, 0), end: Offset.zero).animate(CurvedAnimation(parent: _ctrlTooltip, curve: Curves.easeOutCubic));

  }

  // --------------------------------------------------------------------------
  // LÓGICA MESTRA: SINCRONIZA BACKEND E FRONTEND
  // --------------------------------------------------------------------------
  Future<void> _iniciarAppSincronizado() async {
    // Inicia simultaneamente o GPS, o Download do BD e a Animação Visual
    await Future.wait([
      _preCarregarLocalizacao(),
      _preCarregarDadosEImagens(),
      _executarAnimacaoVisual(),
    ]);

    // === A MÁGICA: ESPERA O ÁUDIO TERMINAR! ===
    // Se a voz estiver falando, o aplicativo congela aqui até ela acabar
    await gerenciadorVoz.aguardarFilaTerminar();

    if (!mounted) return;

    // Quando TUDO estiver pronto, apaga a tela suavemente
    _ctrlFadeTelaFinal.forward();
    await Future.delayed(const Duration(milliseconds: 600));

    if (!mounted) return;

    // REMOVIDO O pararVoz() DAQUI!
    // Isso permite que o áudio flua naturalmente para a tela_nivel.

    Navigator.pushReplacement(
      context,
      PageRouteBuilder(
        pageBuilder: (_, _, _) => TelaNivel(
          posicaoPreCarregada: _posicaoInicialCarregada,
          dadosEscolas: _dadosSupabase,
        ),
        transitionDuration: Duration.zero,
      ),
    );
  }

  // --------------------------------------------------------------------------
  // O STORYTELLING VISUAL (A Linha do Tempo da Animação)
  // --------------------------------------------------------------------------
  Future<void> _executarAnimacaoVisual() async {
    // 1. Respiro inicial (Meio segundo)
    await Future.delayed(const Duration(milliseconds: 400));
    if (!mounted) return;

    // 2. O texto "VEM" aparece
    _ctrlVem.forward();
    await Future.delayed(const Duration(milliseconds: 200));
    if (!mounted) return;

    // 3. A pílula "[PRA]" pula na tela
    _ctrlPra.forward();
    await Future.delayed(const Duration(milliseconds: 400));
    if (!mounted) return;

    // 4. A logo gigante "EJA" sobe majestosamente
    _ctrlEja.forward();
    await Future.delayed(const Duration(milliseconds: 500));
    if (!mounted) return;

    // 5. O prêmio visual: Um brilho premium cruza a logo EJA.
    _ctrlShimmer.forward();

    // 6. Inicia o loader no rodapé (fica tocando em loop reverso)
    _ctrlLoader.repeat(reverse: true);

    // === NOVO: 7. Surge a dica de acessibilidade deslizando! ===
    _ctrlTooltip.forward();

    // Acessibilidade auditiva tocando após o impacto visual inicial
    // Acessibilidade auditiva tocando após o impacto visual inicial
    if (acessibilidadeAtivada.value) {
      await configurarTts();
      await gerenciadorVoz.speak(
        'Seja bem-vindo! Estamos carregando as informações para você.',
      );
    } else {
      // O tempo extra para apreciar a marca só roda se o áudio não estiver ativado
      await Future.delayed(const Duration(milliseconds: 2000));
    }
  }

  // --------------------------------------------------------------------------
  // FUNÇÕES DE BACKEND INTACTAS (GEOLOCATION & SUPABASE)
  // --------------------------------------------------------------------------
  Future<void> _preCarregarLocalizacao() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return;
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) return;
      }
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      if (mounted) setState(() => _posicaoInicialCarregada = position);
    } catch (e) {
      debugPrint('Erro GPS: $e');
    }
  }

  Future<void> _preCarregarDadosEImagens() async {
    try {
      _dadosSupabase = await Supabase.instance.client
          .from('escolas')
          .select('*, turnos_escola(*)');
      List<Future<void>> tarefas = [];

      for (var linha in _dadosSupabase) {
        if (linha['image_url'] != null &&
            linha['image_url'].toString().trim().isNotEmpty) {
          var urls = linha['image_url']
              .toString()
              .split(',')
              .map((e) => e.trim());
          for (var url in urls) {
            if (url.isNotEmpty) {
              tarefas.add(
                precacheImage(NetworkImage(url), context).catchError((_) {}),
              );
            }
          }
        }
      }
      // Aguarda todos os downloads terminarem
      await Future.wait(tarefas);
    } catch (e) {
      debugPrint('Erro no pré-carregamento: $e');
    }
  }

  // --------------------------------------------------------------------------
  // LIMPEZA DA MEMÓRIA
  // --------------------------------------------------------------------------
  @override
  void dispose() {
    _ctrlVem.dispose();
    _ctrlPra.dispose();
    _ctrlEja.dispose();
    _ctrlShimmer.dispose();
    _ctrlLoader.dispose();
    _ctrlFadeTelaFinal.dispose();
    _ctrlTooltip.dispose();
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    super.dispose();
  }

  // --------------------------------------------------------------------------
  // CONSTRUÇÃO DA INTERFACE (O PALCO)
  // --------------------------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    // Cor predominante inspirada na sua imagem

    return Scaffold(
      backgroundColor: Paleta.azulPrincipal,
      body: AnimatedBuilder(
        animation: _animFadeTelaFinal,
        builder: (context, child) =>
            Opacity(opacity: _animFadeTelaFinal.value, child: child),
        child: SafeArea(
          child: Stack(
            children: [
              // ====================================================================
              // ESTRUTURA CENTRAL: A TIPOGRAFIA ROBUSTA
              // ====================================================================
              Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // LINHA SUPERIOR: "VEM" + Pílula "[PRA]"
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // TEXTO: VEM
                        SlideTransition(
                          position: _animVemSlide,
                          child: FadeTransition(
                            opacity: _animVemOpacity,
                            child: Text(
                              'VEM',
                              style: GoogleFonts.inter(
                                fontSize: 22,
                                fontWeight: FontWeight.w400,
                                color: Colors.white.withValues(
                                  alpha: 0.6,
                                ), // Levemente transparente para não roubar a cena
                                letterSpacing: 4.0,
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(width: 8),

                        // PÍLULA: [PRA]
                        FadeTransition(
                          opacity: _animPraOpacity,
                          child: ScaleTransition(
                            scale: _animPraScale,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(
                                  8,
                                ), // Bordas arredondadas do botão
                              ),
                              child: Text(
                                'PRA',
                                style: GoogleFonts.inter(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  color: Paleta
                                      .azulPrincipal, // A cor do texto vazando o fundo
                                  letterSpacing: 1.0,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),

                    // O espaço negativo para encaixar o EJA logo abaixo
                    const SizedBox(height: 2),

                    // TEXTO GIGANTE: EJA
                    SlideTransition(
                      position: _animEjaSlide,
                      child: FadeTransition(
                        opacity: _animEjaOpacity,
                        child: AnimatedBuilder(
                          animation: _ctrlShimmer,
                          builder: (context, child) {
                            return ShaderMask(
                              blendMode: BlendMode.srcATop,
                              shaderCallback: (bounds) {
                                // O pincel mágico que varre o texto
                                return LinearGradient(
                                  begin: const Alignment(-1.0, 0.0),
                                  end: const Alignment(1.0, 0.0),
                                  colors: [
                                    Colors.white.withValues(
                                      alpha: 0.0,
                                    ), // Invisível
                                    Colors.white.withValues(
                                      alpha: 0.9,
                                    ), // Brilho estourado
                                    Colors.white.withValues(
                                      alpha: 0.0,
                                    ), // Invisível
                                  ],
                                  stops: [
                                    _animShimmer.value - 0.2,
                                    _animShimmer.value,
                                    _animShimmer.value + 0.2,
                                  ],
                                ).createShader(bounds);
                              },
                              child: Text(
                                'EJA',
                                style: GoogleFonts.archivo(
                                  // A FONTE PESADA QUE VOCÊ SOLICITOU
                                  fontSize: 120, // GIGANTE
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white,
                                  letterSpacing: -4.0, // Bem juntinho e sólido
                                  height: 1.0,
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // ====================================================================
              // RODAPÉ: CARREGANDO + LOGOS INSTITUCIONAIS
              // ====================================================================
              Positioned(
                bottom: 30, // Base encostada em baixo para dar espaço aos logos
                left: 0,
                right: 0,
                child: FadeTransition(
                  opacity: _animLoaderFade,
                  child: Column(
                    children: [
                      // A barrinha desenhada
                      AnimatedBuilder(
                        animation: _animLoaderProgresso,
                        builder: (context, child) {
                          return CustomPaint(
                            size: const Size(60, 4),
                            painter: _LoaderBarPainter(
                              progresso: _animLoaderProgresso.value,
                            ),
                          );
                        },
                      ),

                      const SizedBox(height: 12),

                      // O texto
                      Text(
                        'carregando',
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.white.withValues(alpha: 0.7),
                          letterSpacing: 2.0,
                        ),
                      ),

                      const SizedBox(
                        height: 50,
                      ), // <-- ISSO LEVANTA O CARREGANDO!
                      // ====================================================================
                      // LOGOS DA PREFEITURA E DO IFC (Estilo Premium)
                      // ====================================================================
                      // ====================================================================
                      // LOGOS DA PREFEITURA E DO IFC (Estilo Premium)
                      // ====================================================================
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          // 1. Logo Prefeitura
                          Opacity(
                            opacity: 0.85,
                            child: Image.asset(
                              'assets/logo_prefeitura.png',
                              height: 55,
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stackTrace) =>
                                  const Icon(
                                    Icons.account_balance_rounded,
                                    color: Colors.white70,
                                    size: 36,
                                  ),
                            ),
                          ),

                          const SizedBox(width: 25),

                          // 2. O Separador Elegante
                          Container(
                            height: 45,
                            width: 1.0,
                            color: Colors.white.withValues(alpha: 0.25),
                          ),

                          const SizedBox(width: 25),

                          // 3. Logo IFC (Com ajuste ótico manual)
                          Padding(
                            padding: const EdgeInsets.only(
                              top: 8.0,
                            ), // <-- MÁGICA: Empurra a logo 8 pixels para baixo!
                            child: Opacity(
                              opacity: 0.85,
                              child: Image.asset(
                                'assets/logo_ifc.png',
                                height: 65,
                                fit: BoxFit.contain,
                                errorBuilder: (context, error, stackTrace) =>
                                    const Icon(
                                      Icons.school_rounded,
                                      color: Colors.white70,
                                      size: 36,
                                    ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ], // <--- AGORA SIM A COLUMN FECHA NO LUGAR CERTO!
                  ),
                ),
              ),

              // ====================================================================
              // ACESSIBILIDADE: BOTÃO GLOBAL + TOOLTIP ANIMADO
              // ====================================================================
              Positioned(
                top: 16,
                right: 16,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // A Dica (Tooltip) Animada
                    SlideTransition(
                      position: _animTooltipSlide,
                      child: FadeTransition(
                        opacity: _animTooltipOpacity,
                        child: Container(
                          margin: const EdgeInsets.only(right: 12),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                          ),
                          child: Text(
                            'Ativar audiodescrição?',
                            style: GoogleFonts.inter(
                              color: Colors.white, 
                              fontWeight: FontWeight.w600, 
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ),
                    ),
                    
                    // O Botão Redondo
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                      ),
                      child: const BotaoAcessibilidadeGlobal(
                        textoLeituraTela: 'Seja bem-vindo! Estamos carregando as informações para você.',
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// --------------------------------------------------------------------------
// O PINTOR DA BARRINHA DE CARREGAMENTO (Custom Painter)
// --------------------------------------------------------------------------
class _LoaderBarPainter extends CustomPainter {
  final double progresso;

  _LoaderBarPainter({required this.progresso});

  @override
  void paint(Canvas canvas, Size size) {
    // A trilha de fundo (meio transparente)
    final paintFundo = Paint()
      ..color = Colors.white.withValues(alpha: 0.2)
      ..strokeWidth = 3.0
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    // A linha que se move (branca opaca)
    final paintFrente = Paint()
      ..color = Colors.white.withValues(alpha: 0.8)
      ..strokeWidth = 3.0
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final start = Offset(0, size.height / 2);
    final end = Offset(size.width, size.height / 2);

    // Desenha o trilho inteiro
    canvas.drawLine(start, end, paintFundo);

    // Calcula o pedacinho que vai ficar se movendo
    final larguraTraco = size.width * 0.3; // 30% do tamanho total

    // O movimento vai de fora do limite esquerdo até fora do limite direito
    final xAtual = -larguraTraco + ((size.width + larguraTraco) * progresso);

    // Trava para não desenhar fora da barrinha principal (Sem caracteres especiais!)
    final tracoStart = Offset(xAtual.clamp(0.0, size.width), size.height / 2);
    final tracoEnd = Offset(
      (xAtual + larguraTraco).clamp(0.0, size.width),
      size.height / 2,
    );

    // Desenha o segmento em movimento
    if (tracoEnd.dx > 0 && tracoStart.dx < size.width) {
      canvas.drawLine(tracoStart, tracoEnd, paintFrente);
    }
  }

  @override
  bool shouldRepaint(covariant _LoaderBarPainter old) {
    return old.progresso != progresso;
  }
}
