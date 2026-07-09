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

  Widget _buildPassoCardCompacto({
    required String numero, 
    required String texto, 
    required int delayMilissegundos,
  }) {
    return FadeInUp(
      delay: Duration(milliseconds: delayMilissegundos),
      duration: const Duration(milliseconds: 700),
      curve: Curves.easeOutBack, 
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white, 
          borderRadius: BorderRadius.circular(16), 
          border: Border.all(
            color: Colors.grey.shade300,
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: Paleta.iconeAcaoCadastro.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 34, 
              height: 34,
              decoration: const BoxDecoration(
                color: Paleta.bolinhaPassoSucesso,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  numero,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: TextoAcessivel(
                texto: texto,
                estilo: GoogleFonts.inter(
                  fontSize: 14, 
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
    return Scaffold(
      backgroundColor: const Color(0xFFF8F7FF), 
      body: SafeArea(
        child: Stack( 
          children: [
            
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Column(
                children: [
                  
                  const Spacer(flex: 2),

                  ZoomIn(
                    duration: const Duration(milliseconds: 500),
                    child: Container(
                      width: 100, 
                      height: 100, 
                      decoration: BoxDecoration(
                        color: Paleta.corCheckSucesso,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Paleta.corCheckSucesso.withValues(alpha: 0.4),
                            blurRadius: 25,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ), 
                      child: const _CheckAnimado(),
                    ),
                  ),
                  
                  const SizedBox(height: 28),
                  
                  FadeInUp(
                    duration: const Duration(milliseconds: 800),
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      child: TextoAcessivel(
                        texto: 'Inscrição Realizada!', 
                        alinhamento: TextAlign.center, 
                        corIcone: Paleta.corCheckSucesso,
                        estilo: GoogleFonts.inter(
                          fontSize: 30, 
                          fontWeight: FontWeight.w900, 
                          color: Paleta.textoTituloCadastro,
                          letterSpacing: -1.0,
                        ),
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 16),

                  FadeInUp(
                    duration: const Duration(milliseconds: 1000),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: Paleta.fundoAvisoSucesso,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: TextoAcessivel(
                        texto: 'Fique atento ao seu WhatsApp ou e-mail.', 
                        alinhamento: TextAlign.center, 
                        corIcone: Paleta.textoAvisoSucesso,
                        estilo: GoogleFonts.inter(
                          fontSize: 14, 
                          fontWeight: FontWeight.w800,
                          color: Paleta.textoAvisoSucesso,
                        ),
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 28),
                  
                  FadeInUp(
                    duration: const Duration(milliseconds: 1200),
                    child: TextoAcessivel(
                      texto: 'Veja o que acontece agora:', 
                      alinhamento: TextAlign.center, 
                      corIcone: const Color(0xFF7C3AED), 
                      estilo: GoogleFonts.inter(
                        fontSize: 14, 
                        fontWeight: FontWeight.w600,
                        color: Colors.grey.shade500, 
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  _buildPassoCardCompacto(
                    numero: '1', 
                    texto: 'A escola recebe seu interesse', 
                    delayMilissegundos: 1400,
                  ),
                  _buildPassoCardCompacto(
                    numero: '2', 
                    texto: 'A secretaria entra em contato com você', 
                    delayMilissegundos: 1600,
                  ),
                  _buildPassoCardCompacto(
                    numero: '3', 
                    texto: 'Você confirma a matrícula presencialmente', 
                    delayMilissegundos: 1800,
                  ),

                  const Spacer(flex: 3),
                  
                  FadeInUp(
                    delay: const Duration(milliseconds: 2200),
                    duration: const Duration(milliseconds: 600),
                    child: SizedBox(
                      width: double.infinity, 
                      height: 60,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Paleta.botaoPrincipalCadastro,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
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
                        child: const TextoAcessivel(
                          texto: 'Voltar ao Início', 
                          alinhamento: TextAlign.center, 
                          corIcone: Colors.white,
                          estilo: TextStyle(
                            fontSize: 18, 
                            fontWeight: FontWeight.w900, 
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 30),
                  
                ],
              ),
            ),

            // ============================================================================
            // MÁGICA 2: MODO EXPLOSIVO (Espalha num estalo só e com medida exata de papéis)
            // ============================================================================
            Align(
              alignment: Alignment.topCenter,
              child: ConfettiWidget(
                confettiController: _controleConfete,
                blastDirectionality: BlastDirectionality.explosive, // Atira para 360 graus da tela!
                maxBlastForce: 25,       // Papel espalha bem longe
                minBlastForce: 5,        // Alguns papéis ficam no meio
                emissionFrequency: 1.0,  // Solta toda a carga de uma vez
                numberOfParticles: 50,   // Número perfeito para não tapar os textos da tela
                gravity: 0.15,           // Cai bem leve
                shouldLoop: false,       
                colors: const [
                  Colors.green,
                  Colors.blue,
                  Colors.pink,
                  Colors.orange,
                  Paleta.bolinhaPassoSucesso, // <-- Substituiu o roxo!
                  Paleta.corCheckSucesso      // <-- Verde do check!  
                ],
              ),
            ),

            Positioned(
              top: 20, 
              right: 20,
              child: Container(
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
  const _CheckAnimado();

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
          painter: _CheckPainter(_animation.value),
          size: const Size(100, 100),
        );
      }
    );
  }
}

class _CheckPainter extends CustomPainter {
  final double progress;
  _CheckPainter(this.progress);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..strokeWidth = 8.0
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
  bool shouldRepaint(covariant _CheckPainter old) => old.progress != progress;
}