import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import 'package:confetti/confetti.dart'; 
import 'dart:math'; 
import '../paleta.dart';
import 'tela_abertura.dart'; 
import '../leitor_texto.dart';

class TelaSucesso extends StatefulWidget {
  const TelaSucesso({
    super.key,
  });

  @override
  State<TelaSucesso> createState() => _TelaSucessoState();
}

class _TelaSucessoState extends State<TelaSucesso> {
  late ConfettiController _controleConfete;
  
  @override
  void initState() {
    super.initState();
    
    // ============================================================================
    // MÁGICA 1: O CANHÃO AGORA DURA SÓ 200 MILISSEGUNDOS! (Apenas um pulso/tiro)
    // ============================================================================
    _controleConfete = ConfettiController(duration: const Duration(milliseconds: 200));
    
    _controleConfete.play();
    _iniciarLeituraSucesso();
  }

  void _iniciarLeituraSucesso() async {
    await configurarTts();
    
    if (!mounted || !acessibilidadeAtivada.value) return;
    await gerenciadorVoz.speak("Inscrição realizada!");
    
    if (!mounted || !acessibilidadeAtivada.value) return;
    await gerenciadorVoz.speak("Fique atento ao seu WhatsApp ou e-mail. Veja o que acontece agora:");

    if (!mounted || !acessibilidadeAtivada.value) return;
    await gerenciadorVoz.speak(
      "Passo 1: A escola recebe seu interesse. Passo 2: A secretaria entra em contato com você. Passo 3: Você confirma a matrícula presencialmente."
    );
  }

  @override
  void dispose() {
    _controleConfete.dispose();
    pararVoz(); 
    super.dispose();
  }

  // MÉTODO ATUALIZADO: Recebe o multiplicador mestre para inflar textos e paddings responsivamente
  Widget _buildPassoCardCompacto({
    required String numero, 
    required String texto, 
    required int delayMilissegundos,
    required double escala,
  }) {
    return FadeInUp(
      delay: Duration(milliseconds: delayMilissegundos),
      duration: const Duration(milliseconds: 700),
      curve: Curves.easeOutBack, 
      child: Container(
        margin: EdgeInsets.only(bottom: 12 * escala),
        padding: EdgeInsets.symmetric(horizontal: 16 * escala, vertical: 14 * escala),
        decoration: BoxDecoration(
          color: Colors.white, 
          borderRadius: BorderRadius.circular(16 * escala), 
          border: Border.all(
            color: Colors.grey.shade300,
            width: 1.5 * escala,
          ),
          boxShadow: [
            BoxShadow(
              color: Paleta.iconeAcaoCadastro.withValues(alpha: 0.04),
              blurRadius: 10 * escala,
              offset: Offset(0, 4 * escala),
            )
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 34 * escala, 
              height: 34 * escala,
              decoration: const BoxDecoration(
                color: Paleta.bolinhaPassoSucesso,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  numero,
                  style: GoogleFonts.inter(
                    fontSize: 15 * escala,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            SizedBox(width: 14 * escala),
            Expanded(
              child: TextoAcessivel(
                texto: texto,
                ocultarIcone: true,
                estilo: GoogleFonts.inter(
                  fontSize: 14 * escala, 
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF1E1B4B), 
                  height: 1.2,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final Size screenSize = MediaQuery.of(context).size;
    final targetPlatform = Theme.of(context).platform;
    final bool isDispositivoMovel = targetPlatform == TargetPlatform.android || targetPlatform == TargetPlatform.iOS;
    
    // Breakpoint de tamanho unificado seguro para tablets
    final bool ehTabletReal = isDispositivoMovel && screenSize.shortestSide >= 600;
    final bool ehTelaGrandeComputador = !isDispositivoMovel && screenSize.width > 1280;

    // Configuração mestre do fator multiplicador e restrição de largura
    double escalaDinamica = 1.0;
    double larguraMaximaSucesso = 500;

    if (ehTabletReal) {
      if (screenSize.width >= 1200 || screenSize.height >= 1800) {
        escalaDinamica = 2.0; // Tablet Grande
        larguraMaximaSucesso = screenSize.width * 0.85;
      } else {
        escalaDinamica = 1.6; // Tablet Médio
        larguraMaximaSucesso = screenSize.width * 0.85;
      }
    } else if (ehTelaGrandeComputador) {
      larguraMaximaSucesso = 600;
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8F7FF), 
      body: SafeArea(
        child: Stack( 
          children: [
            Center(
              child: Container(
                constraints: BoxConstraints(maxWidth: larguraMaximaSucesso),
                padding: EdgeInsets.symmetric(horizontal: 24.0 * (escalaDinamica > 1.0 ? 1.5 : 1.0)),
                child: Column(
                  children: [
                    const Spacer(flex: 2),

                    ZoomIn(
                      duration: const Duration(milliseconds: 500),
                      child: Container(
                        width: 100 * escalaDinamica, 
                        height: 100 * escalaDinamica, 
                        decoration: BoxDecoration(
                          color: Paleta.corCheckSucesso,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Paleta.corCheckSucesso.withValues(alpha: 0.4),
                              blurRadius: 25 * escalaDinamica,
                              offset: Offset(0, 10 * escalaDinamica),
                            ),
                          ],
                        ), 
                        child: Center(
                          child: SizedBox(
                            width: 100 * escalaDinamica,
                            height: 100 * escalaDinamica,
                            child: _CheckAnimado(escala: escalaDinamica),
                          ),
                        ),
                      ),
                    ),
                    
                    SizedBox(height: 28 * escalaDinamica),
                    
                    // TÍTULO DA TELA
                    FadeInUp(
                      duration: const Duration(milliseconds: 800),
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: TextoAcessivel(
                          texto: 'Inscrição Realizada!', 
                          textoOcultoParaLer: 'Inscrição Realizada! Fique atento ao seu WhatsApp ou e-mail. Veja o que acontece agora: Passo 1: A escola recebe seu interesse. Passo 2: A secretaria entra em contato com você. Passo 3: Você confirma a matrícula presencialmente.',
                          alinhamento: TextAlign.center, 
                          corIcone: Paleta.corCheckSucesso,
                          estilo: GoogleFonts.inter(
                            fontSize: 30 * escalaDinamica, 
                            fontWeight: FontWeight.w900, 
                            color: Paleta.textoTituloCadastro,
                            letterSpacing: -1.0,
                          ),
                        ),
                      ),
                    ),
                    
                    SizedBox(height: 16 * escalaDinamica),

                    // ALERTA DE CONTATO
                    FadeInUp(
                      duration: const Duration(milliseconds: 1000),
                      child: Container(
                        padding: EdgeInsets.symmetric(horizontal: 16 * escalaDinamica, vertical: 10 * escalaDinamica),
                        decoration: BoxDecoration(
                          color: Paleta.fundoAvisoSucesso,
                          borderRadius: BorderRadius.circular(12 * escalaDinamica),
                        ),
                        child: TextoAcessivel(
                          texto: 'Fique atento ao seu WhatsApp ou e-mail.', 
                          ocultarIcone: true,
                          alinhamento: TextAlign.center, 
                          corIcone: Paleta.textoAvisoSucesso,
                          estilo: GoogleFonts.inter(
                            fontSize: 14 * escalaDinamica, 
                            fontWeight: FontWeight.w800,
                            color: Paleta.textoAvisoSucesso,
                          ),
                        ),
                      ),
                    ),
                    
                    SizedBox(height: 28 * escalaDinamica),
                    
                    FadeInUp(
                      duration: const Duration(milliseconds: 1200),
                      child: TextoAcessivel(
                        texto: 'Veja o que acontece agora:', 
                        ocultarIcone: true,
                        alinhamento: TextAlign.center, 
                        corIcone: const Color(0xFF7C3AED), 
                        estilo: GoogleFonts.inter(
                          fontSize: 14 * escalaDinamica, 
                          fontWeight: FontWeight.w600,
                          color: Colors.grey.shade500, 
                        ),
                      ),
                    ),
                    
                    SizedBox(height: 16 * escalaDinamica),
                    
                    // CARDS DOS PASSO-A-PASSO COMPACTOS ESCALÁVEIS
                    _buildPassoCardCompacto(
                      numero: '1', 
                      texto: 'A escola recebe seu interesse', 
                      delayMilissegundos: 1400,
                      escala: escalaDinamica,
                    ),
                    _buildPassoCardCompacto(
                      numero: '2', 
                      texto: 'A secretaria entra em contato com você', 
                      delayMilissegundos: 1600,
                      escala: escalaDinamica,
                    ),
                    _buildPassoCardCompacto(
                      numero: '3', 
                      texto: 'Você confirma a matrícula presencialmente', 
                      delayMilissegundos: 1800,
                      escala: escalaDinamica,
                    ),

                    const Spacer(flex: 3),
                    
                    // BOTÃO FINAL DE RETORNO
                    FadeInUp(
                      delay: const Duration(milliseconds: 2200),
                      duration: const Duration(milliseconds: 600),
                      child: SizedBox(
                        width: double.infinity, 
                        height: 60 * (escalaDinamica > 1.0 ? 1.2 : 1.0),
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Paleta.botaoPrincipalCadastro,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20 * escalaDinamica),
                            ), 
                            elevation: 5, 
                            shadowColor: Paleta.botaoPrincipalCadastro.withValues(alpha: 0.5),
                          ),
                          onPressed: () {
                            pararVoz(); 
                            Navigator.pushAndRemoveUntil(
                              context, 
                              MaterialPageRoute(
                                builder: (context) => const TelaAbertura(),
                              ), 
                              (route) => false,
                            );
                          },
                          child: TextoAcessivel(
                            texto: 'Voltar ao Início', 
                            ocultarIcone: true,
                            alinhamento: TextAlign.center, 
                            corIcone: Colors.white,
                            estilo: TextStyle(
                              fontSize: 18 * escalaDinamica, 
                              fontWeight: FontWeight.w900, 
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ),
                    
                    SizedBox(height: 30 * escalaDinamica),
                  ],
                ),
              ),
            ),

            // CANHÃO DE CONFETES EXPLOSIVO DE 360 GRAUS
            Align(
              alignment: Alignment.topCenter,
              child: ConfettiWidget(
                confettiController: _controleConfete,
                blastDirectionality: BlastDirectionality.explosive, 
                maxBlastForce: 25,       
                minBlastForce: 5,        
                emissionFrequency: 1.0,  
                numberOfParticles: 50,   
                gravity: 0.15,           
                shouldLoop: false,       
                colors: const [
                  Colors.green,
                  Colors.blue,
                  Colors.pink,
                  Colors.orange,
                  Paleta.bolinhaPassoSucesso, 
                  Paleta.corCheckSucesso      
                ],
              ),
            ),

            // BOTÃO DE ÁUDIO ASSISTIVO FLUTUANTE SUPERIOR DIREITO
            Positioned(
              top: ehTabletReal ? 32 : 20, 
              right: ehTabletReal ? 32 : 20,
              child: Container(
                // UNIFICADO SIMÉTRICO DA MARCA: 70 pixels no tablet e 44 pixels estáveis no celular
                width: ehTabletReal ? 70 : 44,
                height: ehTabletReal ? 70 : 44,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Paleta.iconeAcaoCadastro.withValues(alpha: 0.1),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: BotaoAcessibilidadeGlobal(
                  textoLeituraTela: "", 
                  acaoPersonalizada: _iniciarLeituraSucesso,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CheckAnimado extends StatefulWidget {
  final double escala;
  const _CheckAnimado({required this.escala});

  @override
  State<_CheckAnimado> createState() => _CheckAnimadoState();
}

class _CheckAnimadoState extends State<_CheckAnimado> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this, 
      duration: const Duration(milliseconds: 600),
    );
    _animation = CurvedAnimation(parent: _controller, curve: Curves.easeInOut);
    
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return CustomPaint(
          painter: _CheckPainter(_animation.value, widget.escala),
          // CORRIGIDO: O tamanho do canvas do desenho cresce proporcionalmente à escala mestre
          size: Size(100 * widget.escala, 100 * widget.escala),
        );
      }
    );
  }
}

class _CheckPainter extends CustomPainter {
  final double progress;
  final double escala;
  _CheckPainter(this.progress, this.escala);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..strokeWidth = 8.0 * escala // Grossura do check cresce dinamicamente no Tablet
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final path = Path();
    
    if (progress > 0) {
      final p1 = Offset(size.width * 0.28, size.height * 0.52);
      final p2 = Offset(size.width * 0.45, size.height * 0.68);
      final p3 = Offset(size.width * 0.72, size.height * 0.35);

      path.moveTo(p1.dx, p1.dy);

      final draw1 = (progress * 2.5).clamp(0.0, 1.0); 
      if (draw1 <= 1.0) {
        path.lineTo(
          p1.dx + (p2.dx - p1.dx) * draw1,
          p1.dy + (p2.dy - p1.dy) * draw1,
        );
      } 
      
      if (progress > 0.4) {
        path.lineTo(p2.dx, p2.dy);
        final draw2 = ((progress - 0.4) * 1.66).clamp(0.0, 1.0); 
        path.lineTo(
          p2.dx + (p3.dx - p2.dx) * draw2,
          p2.dy + (p3.dy - p2.dy) * draw2,
        );
      }
    }
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _CheckPainter old) => old.progress != progress || old.escala != escala;
}