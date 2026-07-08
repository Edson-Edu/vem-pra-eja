import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';
import '../leitor_texto.dart';
import 'tela_nivel.dart';
import 'manutencao.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class TelaAbertura extends StatefulWidget {
  const TelaAbertura({super.key});

  @override
  State<TelaAbertura> createState() => _TelaAberturaState();
}

class _TelaAberturaState extends State<TelaAbertura>
    with TickerProviderStateMixin {

  Position? _posicaoInicialCarregada;
  List<dynamic> _dadosSupabase = [];

  // ── Controllers ────────────────────────────────────────────────────────────
  late AnimationController _ctrlVemPra;
  late Animation<int>       _animVemPra;

  late AnimationController _ctrlEJ;
  late Animation<double>    _animEJOpacity;
  late Animation<Offset>    _animEJSlide;

  // NOVO: Controlador único para as pernas do A ( / e \ ) para desenhar contínuo
  late AnimationController _ctrlALinhas;
  late Animation<double>    _animALinhas;

  // NOVO: Barra fixa (não some mais)
  late AnimationController _ctrlBarra;
  late Animation<double>    _animBarra;

  late AnimationController _ctrlAba;
  late Animation<double>    _animAba;

  late AnimationController _ctrlTopo;
  late Animation<double>    _animTopo;

  late AnimationController _ctrlBorla;
  late Animation<double>    _animBorlaLinha;
  late Animation<double>    _animBorlaCirculo;

  late AnimationController _ctrlFadeTela;
  late Animation<double>    _animFadeTela;

  static const String _textoVemPra = 'vem pra ';

  @override
  void initState() {
    super.initState();
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    _configurarAnimacoes();
    
    // Inicia a função mestre que sincroniza o GPS com a Animação
    _iniciarAppSincronizado();
  }

  void _configurarAnimacoes() {
    _ctrlVemPra = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1200));
    _animVemPra = StepTween(begin: 0, end: _textoVemPra.length)
        .animate(CurvedAnimation(parent: _ctrlVemPra, curve: Curves.linear));

    _ctrlEJ = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1000));
    _animEJOpacity = Tween<double>(begin: 0, end: 1)
        .animate(CurvedAnimation(parent: _ctrlEJ, curve: Curves.easeOut));
    _animEJSlide =
        Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero)
            .animate(CurvedAnimation(parent: _ctrlEJ, curve: Curves.easeOut));

    // NOVA ANIMAÇÃO: Faz o caminho do / e depois \
    _ctrlALinhas = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1000));
    _animALinhas = Tween<double>(begin: 0, end: 1)
        .animate(CurvedAnimation(parent: _ctrlALinhas, curve: Curves.easeInOut));

    // NOVA ANIMAÇÃO: Barra aparece e fica
    _ctrlBarra = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600));
    _animBarra = Tween<double>(begin: 0, end: 1)
        .animate(CurvedAnimation(parent: _ctrlBarra, curve: Curves.easeOut));

    _ctrlAba = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 700));
    _animAba = Tween<double>(begin: 0, end: 1)
        .animate(CurvedAnimation(parent: _ctrlAba, curve: Curves.easeOut));

    _ctrlTopo = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600));
    _animTopo = Tween<double>(begin: 0, end: 1)
        .animate(CurvedAnimation(parent: _ctrlTopo, curve: Curves.easeOut));

    _ctrlBorla = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900));
    _animBorlaLinha = Tween<double>(begin: 0, end: 1).animate(
        CurvedAnimation(
            parent: _ctrlBorla,
            curve: const Interval(0.0, 0.55, curve: Curves.easeOut)));
    _animBorlaCirculo = Tween<double>(begin: 0, end: 1).animate(
        CurvedAnimation(
            parent: _ctrlBorla,
            curve: const Interval(0.5, 1.0, curve: Curves.elasticOut)));

    _ctrlFadeTela = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 800));
    _animFadeTela = Tween<double>(begin: 1, end: 0)
        .animate(CurvedAnimation(parent: _ctrlFadeTela, curve: Curves.easeIn));
  }

  Future<void> _iniciarAppSincronizado() async {
    // Sincroniza GPS e Animação
    await Future.wait([
      _preCarregarLocalizacao(),
      _preCarregarDadosEImagens(),
      _executarAnimacaoVisual(),
    ]);

    if (!mounted) return;

    // Só depois das DUAS prontas, a tela faz o fade de saída
    _ctrlFadeTela.forward();
    await Future.delayed(const Duration(milliseconds: 800));
    
    if (!mounted) return;

    pararVoz();
    Navigator.pushReplacement(
      context,
      PageRouteBuilder(
        // TROQUE AQUI:
        pageBuilder: (_, _, _) => TelaManutencao(
          posicaoPreCarregada: _posicaoInicialCarregada,
          dadosEscolas: _dadosSupabase, // <-- PASSANDO O BASTÃO!
        ),
        transitionDuration: Duration.zero,
      ),
    );
  }

  // NOVA ORDEM DE EXECUÇÃO
  Future<void> _executarAnimacaoVisual() async {
    await Future.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;

    _ctrlVemPra.forward();
    await Future.delayed(const Duration(milliseconds: 1300));
    if (!mounted) return;

    _ctrlEJ.forward();
    await Future.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;

    // Desenha o / e o \
    _ctrlALinhas.forward();
    await Future.delayed(const Duration(milliseconds: 1000));
    if (!mounted) return;

    // Desenha a barra do meio - fixa
    _ctrlBarra.forward();
    await Future.delayed(const Duration(milliseconds: 500));
    if (!mounted) return;

    // Desenha o chapéu
    _ctrlAba.forward();
    await Future.delayed(const Duration(milliseconds: 400));
    if (!mounted) return;

    _ctrlTopo.forward();
    await Future.delayed(const Duration(milliseconds: 400));
    if (!mounted) return;

    _ctrlBorla.forward();
    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;

    if (acessibilidadeAtivada.value) {
      await configurarTts();
      await gerenciadorVoz.speak('Bem-vindo ao aplicativo Vem pra EJA.');
    }

    // Tempo de respiro no final para apreciar a logo
    await Future.delayed(const Duration(milliseconds: 1500)); 
  }

  // Função independente do GPS
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
          desiredAccuracy: LocationAccuracy.high);
      if (mounted) setState(() => _posicaoInicialCarregada = position);
    } catch (e) {
      debugPrint('Erro GPS: $e');
    }
  }

// MÁGICA: Baixa o banco de dados e as fotos de uma vez!
  Future<void> _preCarregarDadosEImagens() async {
    try {
      _dadosSupabase = await Supabase.instance.client.from('escolas').select('*, turnos_escola(*)');
      List<Future<void>> tarefas = [];
      
      for (var linha in _dadosSupabase) {
        if (linha['image_url'] != null && linha['image_url'].toString().trim().isNotEmpty) {
          var urls = linha['image_url'].toString().split(',').map((e) => e.trim());
          for (var url in urls) {
            if (url.isNotEmpty) {
              tarefas.add(precacheImage(NetworkImage(url), context).catchError((_) {}));
            }
          }
        }
      }
      await Future.wait(tarefas);
    } catch (e) {
      debugPrint('Erro no pré-carregamento: $e');
    }
  }


  @override
  void dispose() {
    _ctrlVemPra.dispose();
    _ctrlEJ.dispose();
    _ctrlALinhas.dispose();
    _ctrlBarra.dispose();
    _ctrlAba.dispose();
    _ctrlTopo.dispose();
    _ctrlBorla.dispose();
    _ctrlFadeTela.dispose();
    pararVoz();
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF4F46E5),
      body: AnimatedBuilder(
        animation: _ctrlFadeTela,
        builder: (context, child) =>
            Opacity(opacity: _animFadeTela.value, child: child),
        child: SafeArea(
          child: Stack(
            children: [
              // ── Logo centralizado ─────────────────────────────────────────
              Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // "vem pra " digitando
                    AnimatedBuilder(
                      animation: _animVemPra,
                      builder: (_, _) {
                        final visivel = _textoVemPra.substring(
                            0,
                            _animVemPra.value
                                .clamp(0, _textoVemPra.length));
                        return Text(
                          visivel,
                          style: GoogleFonts.inter(
                            fontSize: 26,
                            fontWeight: FontWeight.w700,
                            color: Colors.white.withValues(alpha: 0.65),
                            letterSpacing: 4,
                          ),
                        );
                      },
                    ),

                    const SizedBox(height: 4),

                    // "EJ" + A animado
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        SlideTransition(
                          position: _animEJSlide,
                          child: FadeTransition(
                            opacity: _animEJOpacity,
                            child: Text(
                              'EJ',
                              style: GoogleFonts.inter(
                                fontSize: 80,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                letterSpacing: -2,
                                height: 1,
                              ),
                            ),
                          ),
                        ),
                        // A virando chapéu (mesma fonte)
                        SizedBox(
                          width: 65, // Ajuste milimétrico do tamanho
                          height: 80,
                          child: AnimatedBuilder(
                            animation: Listenable.merge([
                              _ctrlALinhas,
                              _ctrlBarra,
                              _ctrlAba,
                              _ctrlTopo,
                              _ctrlBorla,
                            ]),
                            builder: (_, _) => CustomPaint(
                              painter: _LetrAChapeu(
                                progLinhas: _animALinhas.value,
                                progBarra: _animBarra.value,
                                progAba: _animAba.value,
                                progTopo: _animTopo.value,
                                progLinha: _animBorlaLinha.value,
                                progCirculo: _animBorlaCirculo.value,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // ── Loader rodapé ─────────────────────────────────────────────
              Positioned(
                bottom: 40,
                left: 0,
                right: 0,
                child: FadeTransition(
                  opacity: _animEJOpacity,
                  child: Column(
                    children: [
                      SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                              Colors.white.withValues(alpha: 0.45)),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Carregando...',
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.white.withValues(alpha: 0.4),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // ── Botão acessibilidade ──────────────────────────────────────
              Positioned(
                top: 12,
                right: 16,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const BotaoAcessibilidadeGlobal(
                    textoLeituraTela:
                        'Bem-vindo ao aplicativo Vem pra EJA.',
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CustomPainter — A SIMULANDO A FONTE INTER W900 COM CHAPÉU
// ─────────────────────────────────────────────────────────────────────────────

class _LetrAChapeu extends CustomPainter {
  final double progLinhas;
  final double progBarra;
  final double progAba;
  final double progTopo;
  final double progLinha;
  final double progCirculo;

  _LetrAChapeu({
    required this.progLinhas,
    required this.progBarra,
    required this.progAba,
    required this.progTopo,
    required this.progLinha,
    required this.progCirculo,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Coordenadas simulando o "A" do Inter Black
    final topo = Offset(w * 0.50, h * 0.20);
    final baseEsq = Offset(w * 0.12, h * 0.90);
    final baseDir = Offset(w * 0.88, h * 0.90);

    // MÁGICA: Pincel Grosso, corte quadrado na base e ponta chanfrada (bevel)
    // Isso simula as características idênticas de fontes Sans-Serif pesadas.
    final pincelFonte = Paint()
      ..strokeWidth = 15.0 
      ..strokeCap = StrokeCap.butt 
      ..strokeJoin = StrokeJoin.bevel 
      ..style = PaintingStyle.stroke
      ..color = Colors.white;

    final pincelLilas = Paint()
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke
      ..color = const Color(0xFFC4B5FD);

    // ── Pernas do A (Desenha o / e depois o \ sem quebrar a ponta) ──────────
    if (progLinhas > 0) {
      final pathLinhas = Path()
        ..moveTo(baseEsq.dx, baseEsq.dy)
        ..lineTo(topo.dx, topo.dy)
        ..lineTo(baseDir.dx, baseDir.dy);
      _drawPartial(canvas, pathLinhas, pincelFonte, progLinhas);
    }

    // ── Barra do meio (Fixa) ────────────────────────────────────────────────
    if (progBarra > 0) {
      final barraY = h * 0.65;
      final pathBarra = Path()
        ..moveTo(w * 0.26, barraY)
        ..lineTo(w * 0.74, barraY);
      _drawPartial(canvas, pathBarra, pincelFonte, progBarra);
    }

    // ── Aba do chapéu (Curva) ───────────────────────────────────────────────
    if (progAba > 0) {
      _drawPartial(
        canvas,
        Path()
          ..moveTo(w * 0.05, h * 0.20)
          ..quadraticBezierTo(w * 0.50, h * 0.08, w * 0.95, h * 0.20),
        pincelLilas,
        progAba,
      );
    }

    // ── Topo do Chapéu ──────────────────────────────────────────────────────
    if (progTopo > 0) {
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(w * 0.25, h * 0.02, w * 0.50, h * 0.12),
          const Radius.circular(3),
        ),
        Paint()
          ..color = const Color(0xFFC4B5FD).withValues(alpha: progTopo.clamp(0.0, 1.0))
          ..style = PaintingStyle.fill,
      );
    }

    // ── Borla: Linha pendurada ──────────────────────────────────────────────
    if (progLinha > 0) {
      _drawPartial(
        canvas,
        Path()
          ..moveTo(w * 0.75, h * 0.08)
          ..lineTo(w * 0.95, h * 0.32),
        pincelLilas,
        progLinha,
      );
    }

    // ── Borla: Bolinha ──────────────────────────────────────────────────────
    if (progCirculo > 0) {
      canvas.drawCircle(
        Offset(w * 0.95, h * 0.35),
        4.0 * progCirculo.clamp(0.0, 1.0),
        Paint()
          ..color = const Color(0xFFC4B5FD)
          ..style = PaintingStyle.fill,
      );
    }
  }

  void _drawPartial(Canvas canvas, Path path, Paint paint, double progress) {
    if (progress <= 0) return;
    final metric = path.computeMetrics().first;
    canvas.drawPath(
      metric.extractPath(0, metric.length * progress.clamp(0.0, 1.0)),
      paint,
    );
  }

  @override
  bool shouldRepaint(_LetrAChapeu old) =>
      old.progLinhas != progLinhas ||
      old.progBarra != progBarra ||
      old.progAba != progAba ||
      old.progTopo != progTopo ||
      old.progLinha != progLinha ||
      old.progCirculo != progCirculo;
}