import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import 'package:geolocator/geolocator.dart';
import 'tela_nivel.dart';

class TelaManutencao extends StatefulWidget {
  final Position? posicaoPreCarregada;
  final List<dynamic>? dadosEscolas;
  const TelaManutencao({
    super.key,
    this.posicaoPreCarregada,
    this.dadosEscolas,
  });

  @override
  State<TelaManutencao> createState() => _TelaManutencaoState();
}

class _TelaManutencaoState extends State<TelaManutencao> {
  int _toquesSecretos = 0;

  // Função que libera o acesso escondido
  void _ativarAcessoSecreto() {
    setState(() {
      _toquesSecretos++;
    });

    // Se o ícone for tocado 7 vezes, libera o acesso para a TelaNivel
    if (_toquesSecretos >= 7) {
      _toquesSecretos = 0; // Reseta o contador por segurança
      Navigator.pushReplacement(
        context,
        PageRouteBuilder(
          pageBuilder: (_, _, _) => TelaNivel(
            posicaoPreCarregada: widget.posicaoPreCarregada,
            dadosEscolas: widget.dadosEscolas, // <-- PASSANDO O BASTÃO!
          ),
          transitionDuration: const Duration(milliseconds: 500),
          transitionsBuilder: (_, animation, _, child) {
            return FadeTransition(opacity: animation, child: child);
          },
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F7FF),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // O ÍCONE COM O ACESSO SECRETO
                FadeInDown(
                  duration: const Duration(milliseconds: 600),
                  child: GestureDetector(
                    onTap: _ativarAcessoSecreto,
                    // Deixa a área de toque transparente ao invés de dar feedback visual
                    behavior: HitTestBehavior.opaque, 
                    child: Container(
                      padding: const EdgeInsets.all(28),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEDE9FE),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF7C3AED).withValues(alpha: 0.15),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          )
                        ],
                      ),
                      child: const Icon(
                        Icons.handyman_rounded,
                        size: 70,
                        color: Color(0xFF7C3AED),
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(height: 40),
                
                FadeInUp(
                  duration: const Duration(milliseconds: 600),
                  delay: const Duration(milliseconds: 200),
                  child: Text(
                    'Estamos em\nManutenção',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF1E1B4B),
                      height: 1.1,
                      letterSpacing: -0.5,
                    ),
                  ),
                ),
                
                const SizedBox(height: 16),
                
                FadeInUp(
                  duration: const Duration(milliseconds: 600),
                  delay: const Duration(milliseconds: 400),
                  child: Text(
                    'O "Vem Pra EJA" está recebendo algumas melhorias. Voltamos em breve!',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      color: const Color(0xFF455A64),
                      height: 1.5,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}