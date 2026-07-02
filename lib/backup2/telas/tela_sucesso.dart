import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
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
  
  @override
  void dispose() {
    pararVoz(); 
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(
        0xFF3F51B5, // NOVO FUNDO ÍNDIGO PROFUNDO (Sofisticação e Confiança)
      ), 
      body: SafeArea(
        child: Stack( 
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: 16.0,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Spacer(),
                  
                  // ÍCONE DE CHECK CIRCULAR
                  ZoomIn(
                    duration: const Duration(
                      milliseconds: 600,
                    ),
                    child: Container(
                      width: 110, 
                      height: 110, 
                      decoration: const BoxDecoration(
                        color: Colors.white, 
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black26,
                            blurRadius: 20,
                            offset: Offset(
                              0, 
                              10,
                            ),
                          ),
                        ],
                      ), 
                      child: const Icon(
                        Icons.check_rounded, 
                        color: Color(
                          0xFF3F51B5, // Check em Índigo
                        ), 
                        size: 70,
                      ),
                    ),
                  ),
                  
                  const SizedBox(
                    height: 35,
                  ),
                  
                  // TÍTULO DA TELA
                  FadeInUp(
                    duration: const Duration(
                      milliseconds: 800,
                    ),
                    child: const TextoAcessivel(
                      texto: 'Inscrição Realizada!', 
                      alinhamento: TextAlign.center, 
                      corIcone: Colors.white, 
                      estilo: TextStyle(
                        fontSize: 32, 
                        fontWeight: FontWeight.bold, 
                        color: Colors.white,
                        letterSpacing: -1.0,
                      ),
                    ),
                  ),
                  
                  const SizedBox(
                    height: 20,
                  ),

                  // MENSAGEM DE SUCESSO EM ÂMBAR CLARO PARA CONTRASTE
                  FadeInUp(
                    duration: const Duration(
                      milliseconds: 1000,
                    ),
                    child: const TextoAcessivel(
                      texto: 'Tudo certo! Recebemos sua solicitação ✨', 
                      alinhamento: TextAlign.center, 
                      corIcone: Color(
                        0xFFFFB74D, // Âmbar Claro (Lindo contraste com o fundo Azul Índigo)
                      ), 
                      estilo: TextStyle(
                        fontSize: 18, 
                        fontWeight: FontWeight.w600, 
                        color: Color(
                          0xFFFFB74D, 
                        ),
                      ),
                    ),
                  ),
                  
                  const SizedBox(
                    height: 20,
                  ),
                  
                  // TEXTO DA SECRETARIA
                  FadeInUp(
                    duration: const Duration(
                      milliseconds: 1200,
                    ),
                    child: const TextoAcessivel(
                      texto: 'A Secretaria da escola entrará em contato. Aguarde.', 
                      alinhamento: TextAlign.center, 
                      corIcone: Colors.white, 
                      estilo: TextStyle(
                        fontSize: 15, 
                        fontWeight: FontWeight.w500,
                        color: Colors.white70, // Branco levemente opaco
                      ),
                    ),
                  ),
                  
                  const Spacer(),
                  
                  // BOTÃO VOLTAR
                  FadeInUp(
                    duration: const Duration(
                      milliseconds: 1400,
                    ),
                    child: SizedBox(
                      width: double.infinity, 
                      height: 60,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white, 
                          foregroundColor: const Color(
                            0xFF3F51B5, // Texto Índigo
                          ), 
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(
                              20,
                            ),
                          ), 
                          elevation: 10, 
                          shadowColor: Colors.black54,
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
                          estilo: TextStyle(
                            fontSize: 18, 
                            fontWeight: FontWeight.w900, 
                            color: Color(
                              0xFF3F51B5, // Texto Índigo
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  
                  const SizedBox(
                    height: 30,
                  ),
                ],
              ),
            ),
            
            // BOTÃO DE ACESSIBILIDADE COM FUNDO PARA CONTRASTE
            Positioned(
              top: 20, 
              right: 20,
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black26, 
                      blurRadius: 8,
                    ),
                  ],
                ),
                child: const BotaoAcessibilidadeGlobal(
                  textoLeituraTela: "Inscrição Realizada com Sucesso! Tudo certo, recebemos sua solicitação. A secretaria da escola entrará em contato. Aguarde.",
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}