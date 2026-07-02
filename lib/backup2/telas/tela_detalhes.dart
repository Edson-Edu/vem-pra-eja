import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import 'tela_cadastro.dart';
import '../leitor_texto.dart';

class TelaDetalhes extends StatefulWidget {
  final String idEscola; // NOVO: ID que veio do mapa
  final String nomeEscola;
  final String nivel; 
  final String turno;
  final String horario;
  final String descricao;
  final String auxilios;
  final String distancia;

  const TelaDetalhes({
    super.key, 
    required this.idEscola, // Recebe do mapa
    required this.nomeEscola, 
    required this.nivel, 
    required this.turno, 
    required this.horario, 
    required this.descricao, 
    required this.auxilios, 
    required this.distancia,
  });

  @override
  State<TelaDetalhes> createState() => _TelaDetalhesState();
}

class _TelaDetalhesState extends State<TelaDetalhes> {
  final ScrollController _controladorDeRolagem = ScrollController();

  @override
  void dispose() {
    pararVoz(); 
    _controladorDeRolagem.dispose();
    super.dispose();
  }

  void _iniciarLeituraComRolagem() async {
    await configurarTts();
    
    _controladorDeRolagem.animateTo(
      0, 
      duration: const Duration(
        milliseconds: 500,
      ), 
      curve: Curves.easeInOut,
    );
    await gerenciadorVoz.speak(
      "${widget.nomeEscola}. Apenas ${widget.distancia} daqui.",
    );
    
    if (!mounted || !acessibilidadeAtivada.value) return; 

    await gerenciadorVoz.speak(
      "Horário e Turma. Turno: ${widget.turno}. Horário: ${widget.horario}",
    );
    if (!mounted || !acessibilidadeAtivada.value) return;

    _controladorDeRolagem.animateTo(
      180, 
      duration: const Duration(
        milliseconds: 600,
      ), 
      curve: Curves.easeInOut,
    );
    await gerenciadorVoz.speak(
      "Como funciona. ${widget.descricao}",
    );
    if (!mounted || !acessibilidadeAtivada.value) return;

    _controladorDeRolagem.animateTo(
      360, 
      duration: const Duration(
        milliseconds: 600,
      ), 
      curve: Curves.easeInOut,
    );
    await gerenciadorVoz.speak(
      "Auxílios. ${widget.auxilios}",
    );
    if (!mounted || !acessibilidadeAtivada.value) return;

    _controladorDeRolagem.animateTo(
      _controladorDeRolagem.position.maxScrollExtent, 
      duration: const Duration(
        milliseconds: 800,
      ), 
      curve: Curves.easeInOut,
    );
    
    await gerenciadorVoz.speak(
      "Clique no botão laranja fixo no rodapé para Realizar Inscrição.",
    );
  }

  Widget _cardInfoModerno(
    String titulo, 
    String conteudo, 
    IconData icone,
  ) {
    return FadeInUp(
      duration: const Duration(
        milliseconds: 600,
      ),
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.only(
          bottom: 20,
        ),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(
            20,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF3F51B5).withOpacity(
                0.05,
              ),
              blurRadius: 15,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(
            20,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20, 
                  vertical: 15,
                ),
                decoration: const BoxDecoration(
                  color: Color(0xFFE8EAF6), 
                ),
                child: Row(
                  children: [
                    Icon(
                      icone, 
                      color: const Color(0xFF3F51B5), 
                      size: 22,
                    ),
                    const SizedBox(
                      width: 12,
                    ),
                    Expanded(
                      child: TextoAcessivel(
                        texto: titulo, 
                        estilo: GoogleFonts.inter( 
                          fontSize: 18, 
                          fontWeight: FontWeight.w900, 
                          color: const Color(0xFF3F51B5), 
                          letterSpacing: -0.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(
                  20.0,
                ),
                child: TextoAcessivel(
                  texto: conteudo, 
                  estilo: GoogleFonts.inter( 
                    fontSize: 16, 
                    color: const Color(0xFF455A64), 
                    height: 1.6,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final double paddingTopo = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: const Color(
        0xFFFAFAFA, 
      ), 
      extendBodyBehindAppBar: true, 
      appBar: AppBar(
        backgroundColor: Colors.transparent, 
        elevation: 0, 
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_rounded, 
            color: Colors.white,
          ),
          onPressed: () {
            pararVoz(); 
            Navigator.pop(context);
          },
        ),
        actions: [
          SafeArea(
            child: Container(
              margin: const EdgeInsets.only(
                right: 15, 
                top: 10,
              ),
              decoration: BoxDecoration(
                color: Colors.white, 
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: BotaoAcessibilidadeGlobal(
                textoLeituraTela: "", 
                acaoPersonalizada: _iniciarLeituraComRolagem,
              ),
            ),
          )
        ],
      ),
      body: Column(
        children: [
          FadeInDown(
            duration: const Duration(
              milliseconds: 500,
            ),
            child: Container(
              width: double.infinity, 
              padding: EdgeInsets.only(
                top: paddingTopo + 70, 
                bottom: 30, 
                left: 24, 
                right: 24,
              ),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF3F51B5), 
                    Color(0xFF303F9F), 
                  ],
                ), 
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(30), 
                  bottomRight: Radius.circular(30),
                ),
              ),
              child: Column(
                children: [
                  TextoAcessivel(
                    texto: widget.nomeEscola, 
                    alinhamento: TextAlign.center, 
                    corIcone: Colors.white, 
                    estilo: GoogleFonts.inter( 
                      fontSize: 24, 
                      fontWeight: FontWeight.w900, 
                      color: Colors.white,
                      letterSpacing: -1.0,
                    ),
                  ),
                  const SizedBox(
                    height: 15,
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14, 
                      vertical: 6,
                    ), 
                    decoration: BoxDecoration(
                      color: const Color(0xFFFF9800), 
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: TextoAcessivel(
                      texto: 'Apenas ${widget.distancia} daqui', 
                      corIcone: Colors.white, 
                      estilo: const TextStyle(
                        color: Colors.white, 
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          Expanded(
            child: ListView(
              controller: _controladorDeRolagem, 
              padding: const EdgeInsets.only(
                left: 24, 
                right: 24, 
                top: 25, 
                bottom: 20, 
              ),
              children: [
                _cardInfoModerno(
                  'Horário e Turma', 
                  'Turno: ${widget.turno}\nHorário: ${widget.horario}', 
                  Icons.schedule_rounded,
                ),
                _cardInfoModerno(
                  'Como funciona', 
                  widget.descricao, 
                  Icons.info_outline_rounded,
                ),
                _cardInfoModerno(
                  'Auxílios', 
                  widget.auxilios, 
                  Icons.card_giftcard_rounded,
                ),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.only(
            left: 24, 
            right: 24, 
            top: 15, 
            bottom: 20,
          ),
          decoration: BoxDecoration(
            color: const Color(
              0xFFFAFAFA, 
            ), 
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, -5), 
              ),
            ],
          ),
          child: SizedBox(
            width: double.infinity, 
            height: 60,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(
                  0xFFFF9800, 
                ), 
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ), 
                elevation: 5,
              ),
              onPressed: () {
                pararVoz(); 
                Navigator.push(
                  context, 
                  MaterialPageRoute(
                    builder: (context) => TelaCadastro(
                      idEscolaSelecionada: widget.idEscola, // NOVO: Passa o ID adiante
                      nomeEscolaSelecionada: widget.nomeEscola, 
                      nivelSelecionado: widget.nivel,
                    ),
                  ),
                );
              },
              child: const TextoAcessivel(
                texto: 'Realizar Inscrição', 
                corIcone: Colors.white, 
                alinhamento: TextAlign.center, 
                estilo: TextStyle(
                  color: Colors.white, 
                  fontSize: 18, 
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}