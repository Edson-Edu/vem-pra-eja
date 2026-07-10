import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import 'tela_cadastro.dart';
import 'tela_home.dart'; 
import '../leitor_texto.dart';
import '../paleta.dart';

// ============================================================================
// CLASSE AUXILIAR PARA PADRONIZAR AS CORES E ÍCONES DOS BENEFÍCIOS
// ============================================================================
class _AuxilioVisual {
  final IconData icone;
  final Color corIcone;
  final Color corFundo;
  final String explicacao;

  _AuxilioVisual({
    required this.icone,
    required this.corIcone,
    required this.corFundo,
    required this.explicacao,
  });
}

class TelaDetalhes extends StatefulWidget {
  final String idEscola; 
  final String nomeEscola;
  final String bairro; 
  final String cidade;
  final String nivel; 
  final List<TurnoEscola> turnos; 
  final String distancia;

  const TelaDetalhes({
    super.key, 
    required this.idEscola, 
    required this.nomeEscola, 
    required this.bairro, 
    required this.cidade,
    required this.nivel, 
    required this.turnos, 
    required this.distancia,
  });

  @override
  State<TelaDetalhes> createState() => _TelaDetalhesState();
}

class _TelaDetalhesState extends State<TelaDetalhes> {


  

  // ============================================================================
  // TRADUTOR INTELIGENTE PARA O ÁUDIO (SIGLAS E DIAS)
  // ============================================================================
   String _expandirSiglasParaAudio(String texto) {
    if (texto.isEmpty) return texto;
    String limpo = texto;
    
    // 1. Siglas Escolares (Maiúsculas e minúsculas)
    limpo = limpo.replaceAll(RegExp(r'\bCEJA\b', caseSensitive: false), 'Centro de Educação de Jovens e Adultos');
    limpo = limpo.replaceAll(RegExp(r'\bEBM\b', caseSensitive: false), 'Escola Básica Municipal');
    limpo = limpo.replaceAll(RegExp(r'\bE\.B\.M\.?\b', caseSensitive: false), 'Escola Básica Municipal');
    limpo = limpo.replaceAll(RegExp(r'\bCEM\b', caseSensitive: false), 'Centro Educacional Municipal');
    limpo = limpo.replaceAll(RegExp(r'\bC\.E\.M\.?\b', caseSensitive: false), 'Centro Educacional Municipal');
    limpo = limpo.replaceAll(RegExp(r'\bEEB\b', caseSensitive: false), 'Escola de Educação Básica');
    limpo = limpo.replaceAll(RegExp(r'\bEJA\b', caseSensitive: false), 'Êja');

    // 2. Dias da Semana
    limpo = limpo.replaceAll('Seg', 'segunda')
                 .replaceAll('Ter', 'terça')
                 .replaceAll('Qua', 'quarta')
                 .replaceAll('Qui', 'quinta')
                 .replaceAll('Sex', 'sexta')
                 .replaceAll('Sab', 'sábado').replaceAll('Sáb', 'sábado')
                 .replaceAll('Dom', 'domingo');

    // 3. O SEGREDO DO TRAÇO: Troca qualquer formato de traço por " a "
    limpo = limpo.replaceAll(' - ', ' a ')
                 .replaceAll(' – ', ' a ') // En-dash
                 .replaceAll('-', ' a ')
                 .replaceAll('–', ' a ');

    return limpo;
  }

  // ============================================================================
  // CONTROLADORES E VARIÁVEIS DE ESTADO
  // ============================================================================
  final ScrollController _controladorDeRolagem = ScrollController();
  TurnoEscola? _turnoSelecionado;
  bool _mostrarDicaRolagem = true;

  @override
  void initState() {
    super.initState();
    
    // Auto-selecionar se houver apenas 1 turno
    if (widget.turnos.length == 1) {
      _turnoSelecionado = widget.turnos.first;
    } else {
      _turnoSelecionado = null;
    }

    // Monitora a rolagem para esconder a dica
    _controladorDeRolagem.addListener(() {
      if (_controladorDeRolagem.offset > 15 && _mostrarDicaRolagem) {
        if (mounted) {
          setState(() {
            _mostrarDicaRolagem = false;
          });
        }
      }
    });
  }

  @override
  void dispose() {
    pararVoz(); 
    _controladorDeRolagem.dispose();
    super.dispose();
  }

  // ============================================================================
  // LÓGICA DE ACESSIBILIDADE E LEITURA (TTS)
  // ============================================================================
void _iniciarLeituraComRolagem({bool lerTudo = true}) async {
    await pararVoz(); 
    await Future.delayed(const Duration(milliseconds: 300)); 
    await configurarTts();

    // 1. ESCOLA, BAIRRO E CIDADE (Lê apenas quando abre a tela)
    if (lerTudo) {
      _controladorDeRolagem.animateTo(0, duration: const Duration(milliseconds: 500), curve: Curves.easeInOut);
      await gerenciadorVoz.speak(
        "${_expandirSiglasParaAudio(widget.nomeEscola)}, no bairro ${widget.bairro} em ${widget.cidade}.",
      );
      if (!mounted || !acessibilidadeAtivada.value) return; 
    }

    // 2. TURNO
    if (_turnoSelecionado == null) {
      await gerenciadorVoz.speak("Por favor, selecione um turno na tela.");
      return;
    }

    if (lerTudo) {
      await gerenciadorVoz.speak("Você selecionou o turno da ${_turnoSelecionado!.turno}.");
    } else {
      await gerenciadorVoz.speak("Turno da ${_turnoSelecionado!.turno} selecionado.");
    }
    if (!mounted || !acessibilidadeAtivada.value) return;

    // <-- LIMPA O HORÁRIO AQUI PARA NÃO LER "MENOS"
    String horarioLimpo = _turnoSelecionado!.horario.replaceAll(' - ', ' às ').replaceAll('-', ' às ');

    // 3. AULAS, DIAS E DISTÂNCIA (O "de" já tá embutido no _traduzirParaAudio)
    await gerenciadorVoz.speak(
      "As aulas acontecem das $horarioLimpo, ${_expandirSiglasParaAudio(_turnoSelecionado!.diasAula)}. A escola está a aproximadamente ${widget.distancia} de você.",
    );
    if (!mounted || !acessibilidadeAtivada.value) return;

    // 4. AUXÍLIOS
    _controladorDeRolagem.animateTo(150, duration: const Duration(milliseconds: 600), curve: Curves.easeInOut);
    await gerenciadorVoz.speak(
      "Possui os seguintes auxílios: ${_turnoSelecionado!.auxilios}.",
    );
    if (!mounted || !acessibilidadeAtivada.value) return;

    // 5. COMO FUNCIONA
    _controladorDeRolagem.animateTo(300, duration: const Duration(milliseconds: 600), curve: Curves.easeInOut);
    await gerenciadorVoz.speak(
      "Nessa escola, a Êja funciona da seguinte forma: ${_turnoSelecionado!.descricao}.",
    );
    if (!mounted || !acessibilidadeAtivada.value) return;

    // 6. CONCLUSÃO
    _controladorDeRolagem.animateTo(_controladorDeRolagem.position.maxScrollExtent, duration: const Duration(milliseconds: 800), curve: Curves.easeInOut);
    await gerenciadorVoz.speak(
      "Deseja se inscrever nessa escola? Clique no botão azul no final da tela. Caso deseje ver outra, é só voltar.",
    );
  }

  // ============================================================================
  // LÓGICA DE ÍCONES DE TURNO
  // ============================================================================
  Widget _obterIconeTurno(String turno, bool isSelected) {
    String t = turno.toLowerCase();
    Color corIconeBranco = Colors.white;

    if (t.contains('manhã') || t.contains('manha')) {
      return Icon(
        Icons.wb_sunny_rounded, 
        color: isSelected ? corIconeBranco : Colors.amber.shade500, 
        size: 26,
      );
    }
    if (t.contains('tarde')) {
      return Icon(
        Icons.wb_twilight_rounded, 
        color: isSelected ? corIconeBranco : Colors.orange.shade500, 
        size: 26,
      );
    }
    return Icon(
      Icons.nightlight_round, 
      color: isSelected ? corIconeBranco : Colors.indigo.shade400, 
      size: 24,
    );
  }

  // ============================================================================
  // LÓGICA DE CATEGORIZAÇÃO DE AUXÍLIOS (Sincroniza Cores e Ícones)
  // ============================================================================
  _AuxilioVisual _obterVisualAuxilio(String texto) {
    String textoMinusculo = texto.toLowerCase();
    
    if (textoMinusculo.contains('janta') || 
        textoMinusculo.contains('alimentação') || 
        textoMinusculo.contains('comida') || 
        textoMinusculo.contains('refeição')) {
      return _AuxilioVisual(
        icone: Icons.restaurant_rounded,
        corIcone: Colors.orange.shade700,
        corFundo: Colors.orange.shade50,
        explicacao: "Refeição nutritiva servida gratuitamente no refeitório da escola, garantindo energia para seus estudos após um dia de trabalho.",
      );
    } 
    
    if (textoMinusculo.contains('passe') || 
        textoMinusculo.contains('transporte') || 
        textoMinusculo.contains('ônibus')) {
      return _AuxilioVisual(
        icone: Icons.directions_bus_rounded,
        corIcone: Colors.blue.shade700,
        corFundo: Colors.blue.shade50,
        explicacao: "Acesso a transporte escolar ou passe livre subsidiado pela prefeitura para facilitar seu deslocamento com segurança.",
      );
    } 
    
    if (textoMinusculo.contains('material') || 
        textoMinusculo.contains('livro') || 
        textoMinusculo.contains('didático') || 
        textoMinusculo.contains('apostila')) {
      return _AuxilioVisual(
        icone: Icons.menu_book_rounded,
        corIcone: Paleta.azulIcones, // <-- NOVO
        corFundo: Paleta.azulIcones.withValues(alpha: 0.1), // <-- NOVO
        explicacao: "Você receberá o material didático necessário (como apostilas e cadernos) de forma 100% gratuita para acompanhar as aulas.",
      );
    }
    
   if (textoMinusculo.contains('uniforme') || 
        textoMinusculo.contains('roupa') || 
        textoMinusculo.contains('camisa')) {
      return _AuxilioVisual(
        icone: Icons.checkroom_rounded,
        corIcone: Colors.teal.shade600,
        corFundo: Colors.teal.shade50,
        explicacao: "Kit escolar de vestuário entregue gratuitamente no início do semestre para sua identificação e comodidade dentro da instituição.",
      );
    }

    return _AuxilioVisual(
      icone: Icons.check_circle_outline_rounded,
      corIcone: Paleta.azulBotao, // <-- NOVO
      corFundo: Paleta.azulBotao.withValues(alpha: 0.1), // <-- NOVO
      explicacao: "Detalhes específicos sobre este auxílio estarão disponíveis na secretaria da escola no ato da matrícula.",
    );
  }

  // ============================================================================
  // BOTTOM SHEET DE DETALHES DO AUXÍLIO
  // ============================================================================
  void _abrirDetalheAuxilio(String titulo, _AuxilioVisual visual) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Paleta.azulBotao,
      isScrollControlled: true,
      builder: (BuildContext context) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40, 
                  height: 5,
                  margin: const EdgeInsets.only(bottom: 24),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300, 
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: visual.corFundo, 
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(
                      visual.icone, 
                      color: visual.corIcone, 
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    // <-- NOVO: O título do modal agora é um TextoAcessivel e lê tudo
                    child: TextoAcessivel(
                      texto: titulo,
                      textoOcultoParaLer: "$titulo. ${visual.explicacao}",
                      estilo: GoogleFonts.inter(
                        fontSize: 22, 
                        fontWeight: FontWeight.w900, 
                        color: const Color(0xFF1E1B4B),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              // <-- NOVO: A explicação fica como filho (ocultarIcone: true)
              TextoAcessivel(
                texto: visual.explicacao,
                ocultarIcone: true,
                estilo: GoogleFonts.inter(
                  fontSize: 16, 
                  color: const Color(0xFF455A64), 
                  height: 1.6,
                ),
              ),
              const SizedBox(height: 30),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF7C3AED),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                  onPressed: () => Navigator.pop(context),
                  child: const Text(
                    'Entendi', 
                    style: TextStyle(
                      fontSize: 16, 
                      fontWeight: FontWeight.bold, 
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // ============================================================================
  // MINI CARDS (Dias e Distância) - Ajustados para ter o peso do card de Turno
  // ============================================================================
  Widget _buildMiniCardStatus({
    required IconData icone, 
    required Color corIcone, 
    required Color corFundoIcone, 
    required String label, 
    required String texto,
    required String subTextoDica,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(
            color: const Color(0xFFEDE9FE), 
            width: 1.5,
          ),
          borderRadius: BorderRadius.circular(20), // Mesmo raio do Turno
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: corFundoIcone, 
                shape: BoxShape.circle,
              ),
              child: Icon(
                icone, 
                color: corIcone, 
                size: 20,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12, 
                fontWeight: FontWeight.w700, 
                color: Colors.grey.shade500,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              texto,
              textAlign: TextAlign.center,
              maxLines: 1, 
              style: GoogleFonts.inter(
                fontSize: 15, 
                fontWeight: FontWeight.w900, 
                color: const Color(0xFF1E1B4B), 
                height: 1.1,
              ),
            ),
            if (subTextoDica.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(
                subTextoDica,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                  color: Colors.grey.shade400,
                ),
              ),
            ]
          ],
        ),
      ),
    );
  }

  // ============================================================================
  // CARD MODERNO INDEPENDENTE (Usado para Auxílios e Como Funciona)
  // O Retorno da separação clara!
  // ============================================================================
  Widget _cardInfoModerno({
    required String titulo, 
    String? textoOcultoTitulo, // <-- NOVO: Permite passar o texto que o Pai vai ler
    required IconData iconeHeader, 
    required Color corIcone,
    required Color corFundoIcone,
    Widget? childCustom, 
    String? conteudo,
  }) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFEDE9FE), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF4F46E5).withValues(alpha: 0.04), 
            blurRadius: 15, 
            offset: const Offset(0, 5),
          )
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: corFundoIcone, 
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    iconeHeader, 
                    color: corIcone, 
                    size: 22,
                  ),
                ),
                const SizedBox(width: 14),
                TextoAcessivel(
                  texto: titulo,
                  textoOcultoParaLer: textoOcultoTitulo ?? titulo, // <-- NOVO: Aplica o texto do Pai
                  estilo: GoogleFonts.inter(
                    fontSize: 18, 
                    fontWeight: FontWeight.w900, 
                    color: const Color(0xFF1E1B4B),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            childCustom ?? TextoAcessivel(
              texto: conteudo ?? '',
              estilo: GoogleFonts.inter(
                fontSize: 15, 
                color: const Color(0xFF455A64), 
                height: 1.6,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ============================================================================
  // CONSTRUTOR DA LISTA DE AUXÍLIOS
  // ============================================================================
  Widget _construirListaAuxilios(String auxiliosRaw) {
    List<Widget> linhas = [];
    List<String> lista = auxiliosRaw.split(RegExp(r'[,\n]'));

    for (String item in lista) {
      String textoLimpo = item.trim();
      if (textoLimpo.isEmpty) continue;

      final visual = _obterVisualAuxilio(textoLimpo);

      linhas.add(
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () => _abrirDetalheAuxilio(textoLimpo, visual), 
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 4.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: visual.corFundo, 
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        visual.icone, 
                        color: visual.corIcone, 
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: TextoAcessivel(
                        texto: textoLimpo,
                        ocultarIcone: true, // <-- NOVO: Os filhos ficam com o ícone invisível na lista!
                        estilo: GoogleFonts.inter(
                          fontSize: 15, 
                          color: Colors.grey.shade400,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const Icon(
                      Icons.arrow_forward_ios_rounded, 
                      size: 14, 
                      color: Color(0xFFC4B5FD),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
    }
    
    if(linhas.isEmpty) {
      linhas.add(
        const Text(
          "Nenhum auxílio específico cadastrado.", 
          style: TextStyle(color: Colors.grey),
        ),
      );
    }
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start, 
      children: linhas,
    );
  }

  // ============================================================================
  // WIDGET EXCLUSIVO DA DICA DE ROLAGEM
  // ============================================================================
  Widget _buildDicaDeRolagem() {
    return AnimatedOpacity(
      opacity: _mostrarDicaRolagem ? 1.0 : 0.0,
      duration: const Duration(milliseconds: 300),
      child: Column(
        children: [
          const SizedBox(height: 10),
          Text(
            "Deslize para ver tudo",
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade400,
            ),
          ),
          const SizedBox(height: 4),
          FadeInDown(
            duration: const Duration(milliseconds: 1500),
            child: Icon(
              Icons.keyboard_double_arrow_down_rounded,
              color: Colors.grey.shade400,
              size: 20,
            ),
          ),
        ],
      ),
    );
  }

  // ============================================================================
  // BUILD PRINCIPAL DA TELA
  // ============================================================================
  @override
  Widget build(BuildContext context) {
    final double paddingTopo = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: Paleta.azulPrincipal,
      extendBodyBehindAppBar: true, 
      
      appBar: AppBar(
        backgroundColor: Colors.transparent, 
        elevation: 0, 
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2), 
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.arrow_back, 
              color: Colors.white, 
              size: 20,
            ),
          ),
          onPressed: () async { 
            await pararVoz(); 
            Navigator.pop(context); 
          },
        ),
        actions: [
          SafeArea(
            child: Container(
              margin: const EdgeInsets.only(right: 15, top: 8, bottom: 8),
              decoration: const BoxDecoration(
                color: Colors.white, 
                shape: BoxShape.circle, 
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12, 
                    blurRadius: 6, 
                    offset: Offset(0, 2),
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
          
          // ============================================================================
          // HEADER SUPERIOR ROXO (NOME DA ESCOLA E BAIRRO)
          // ============================================================================
          FadeInDown(
            duration: const Duration(milliseconds: 500),
            child: Container(
              width: double.infinity,
              padding: EdgeInsets.only(
                top: paddingTopo + 50, 
                bottom: 25, 
                left: 24, 
                right: 24,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextoAcessivel(
                    texto: widget.nomeEscola, 
                    corIcone: Colors.white, 
                    estilo: GoogleFonts.inter(
                      fontSize: 26, 
                      fontWeight: FontWeight.w900, 
                      color: Colors.white, 
                      letterSpacing: -0.5, 
                      height: 1.1,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${widget.bairro} • ${widget.cidade} • SC', 
                    style: GoogleFonts.inter(
                      fontSize: 14, 
                      color: Colors.white.withValues(alpha: 0.8),
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // ============================================================================
          // ÁREA BRANCA ROLÁVEL (GAVETA DE DETALHES)
          // ============================================================================
          Expanded(
            child: Container(
              clipBehavior: Clip.antiAlias, 
              decoration: const BoxDecoration(
                color: Paleta.fundoGeral,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(35), 
                  topRight: Radius.circular(35),
                ),
              ),
              child: Column(
                children: [
                  
                  Center(
                    child: Container(
                      margin: const EdgeInsets.only(top: 16, bottom: 8),
                      width: 40,
                      height: 5,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                  
                  Expanded(
                    child: ListView(
                      controller: _controladorDeRolagem, 
                      padding: const EdgeInsets.only(top: 10, bottom: 40),
                      children: [
                        
                        // ========================================================
                        // SEÇÃO 1: SELEÇÃO DE TURNO
                        // ========================================================
                        if (widget.turnos.isNotEmpty)
                          FadeIn(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Padding(
                                  padding: const EdgeInsets.only(left: 24, bottom: 16),
                                  child: Text(
                                    "Selecione um turno:", 
                                    style: GoogleFonts.inter(
                                      fontSize: 14, 
                                      fontWeight: FontWeight.bold, 
                                      color: const Color(0xFF1E1B4B),
                                    ),
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 24),
                                  child: Wrap(
                                    alignment: WrapAlignment.center,
                                    spacing: 12,
                                    runSpacing: 12,
                                    children: widget.turnos.map((turnoOpcao) {
                                      final isSelected = _turnoSelecionado?.id == turnoOpcao.id;

                                      return SizedBox(
                                        width: 102, 
                                        child: GestureDetector(
                                          onTap: () async {
                                            await pararVoz(); 
                                            setState(() { 
                                              _turnoSelecionado = turnoOpcao; 
                                              _mostrarDicaRolagem = true; 
                                            });
                                            // <-- NOVO: Acorda a voz e manda ela ler apenas do turno pra baixo!
                                            if (acessibilidadeAtivada.value) {
                                              _iniciarLeituraComRolagem(lerTudo: false);
                                            }
                                          },
                                          child: AnimatedContainer(
                                            duration: const Duration(milliseconds: 300),
                                            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 4),
                                            decoration: BoxDecoration(
                                              color: isSelected ? Paleta.azulBotao : Colors.white, // <-- AQUI
                                              borderRadius: BorderRadius.circular(20),
                                              border: Border.all(
                                                color: isSelected ? const Color(0xFF4F46E5) : const Color(0xFFEDE9FE), 
                                                width: 1.5,
                                              ),
                                              boxShadow: isSelected 
                                                ? [
                                                    BoxShadow(
                                                      color: Paleta.azulBotao.withAlpha(77),
                                                      blurRadius: 10, 
                                                      offset: const Offset(0, 4),
                                                    ),
                                                  ] 
                                                : [],
                                            ),
                                            child: Column(
                                              children: [
                                                _obterIconeTurno(turnoOpcao.turno, isSelected),
                                                const SizedBox(height: 8),
                                                Text(
                                                  turnoOpcao.turno,
                                                  style: GoogleFonts.inter(
                                                    fontSize: 13,
                                                    fontWeight: FontWeight.w900,
                                                    color: isSelected ? Colors.white : const Color(0xFF1E1B4B),
                                                  ),
                                                ),
                                                const SizedBox(height: 2),
                                                Text(
                                                  turnoOpcao.horario.replaceAll(' - ', '-'),
                                                  style: GoogleFonts.inter(
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.w500,
                                                    color: isSelected ? Colors.white.withValues(alpha: 0.8) : Paleta.textoSecundario,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      );
                                    }).toList(),
                                  ),
                                ),
                                const SizedBox(height: 20),
                              ],
                            ),
                          ),
                          
                        // ========================================================
                        // ESTADO VAZIO: AGUARDANDO SELEÇÃO DO TURNO
                        // ========================================================
                        if (_turnoSelecionado == null)
                          FadeIn(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
                              child: Column(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: Paleta.azulIcones.withValues(alpha: 0.1),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(
                                      Icons.school_rounded, 
                                      size: 40, 
                                      color: Paleta.azulIcones,
                                    ),
                                  ),
                                  const SizedBox(height: 20),
                                  Text(
                                    "Escolha o melhor horário para você",
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.inter(
                                      fontSize: 18, 
                                      color: const Color(0xFF1E1B4B), 
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    "Cada turno tem seus próprios auxílios e informações exclusivas. Toque em um dos turnos acima para ver os detalhes.",
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.inter(
                                      fontSize: 14, 
                                      color: Colors.grey.shade600, 
                                      height: 1.5,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        else ...[
                          
                          // ========================================================
                          // SEÇÃO DE INFORMAÇÕES (CARDS INDEPENDENTES E SEPARADOS)
                          // ========================================================
                          
                          // 1. CARDS DE DIAS E DISTÂNCIA (Alinhados com os Turnos)
                          FadeInUp(
                            key: ValueKey('header_${_turnoSelecionado!.id}'), 
                            duration: const Duration(milliseconds: 400),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 24),
                              child: IntrinsicHeight(
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.stretch, 
                                  children: [
                                    _buildMiniCardStatus(
                                      icone: Icons.calendar_month_rounded, 
                                      corIcone: Colors.blue.shade600, 
                                      corFundoIcone: Colors.blue.shade50, 
                                      label: 'Dias de Aula', 
                                      texto: _turnoSelecionado!.diasAula,
                                      subTextoDica: '', 
                                    ), 
                                    const SizedBox(width: 12),
                                    _buildMiniCardStatus(
                                      icone: Icons.location_on_rounded, 
                                      corIcone: Colors.red.shade500, 
                                      corFundoIcone: Colors.red.shade50, 
                                      label: 'Distância', 
                                      texto: widget.distancia,
                                      subTextoDica: 'do seu local',
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),

                          const SizedBox(height: 25),

                          // 2. CARD EXCLUSIVO DE AUXÍLIOS
                          // 2. CARD EXCLUSIVO DE AUXÍLIOS
                          FadeInUp(
                            key: ValueKey('aux_${_turnoSelecionado!.id}'), 
                            duration: const Duration(milliseconds: 500),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 24),
                              child: _cardInfoModerno(
                                titulo: 'Auxílios', 
                                // <-- NOVO: O Pai lê todos os benefícios de uma vez!
                                textoOcultoTitulo: 'Auxílios oferecidos neste turno: ${_turnoSelecionado!.auxilios}.',
                                iconeHeader: Icons.volunteer_activism_rounded, 
                                corIcone: const Color(0xFFD97706), 
                                corFundoIcone: const Color(0xFFFEF3C7),
                                childCustom: _construirListaAuxilios(_turnoSelecionado!.auxilios), 
                              ),
                            ),
                          ),

                          // 3. CARD EXCLUSIVO DE COMO FUNCIONA
                          FadeInUp(
                            key: ValueKey('info_${_turnoSelecionado!.id}'), 
                            duration: const Duration(milliseconds: 600),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 24),
                              child: _cardInfoModerno(
                                titulo: 'Como funciona', 
                                iconeHeader: Icons.info_outline_rounded, 
                                corIcone: const Color(0xFF2563EB), 
                                corFundoIcone: const Color(0xFFEFF6FF),
                                conteudo: _turnoSelecionado!.descricao, 
                              ),
                            ),
                          ),
                          
                          _buildDicaDeRolagem(),
                          
                        ], 
                      ], 
                    ), 
                  ), 
                ], 
              ), 
            ), 
          ), 
        ], 
      ), 
      
      // ============================================================================
      // BOTÃO FLUTUANTE DE AÇÃO FINAL
      // ============================================================================
      bottomNavigationBar: Container(
        color: Paleta.fundoGeral,
        padding: const EdgeInsets.only(left: 24, right: 24, top: 10, bottom: 30),
        child: SizedBox(
          width: double.infinity, 
          height: 60,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
             backgroundColor: _turnoSelecionado == null 
                  ? Colors.grey.shade300 
                  : Paleta.azulBotao, // <-- AQUI (Cor do botão)
              disabledBackgroundColor: Colors.grey.shade300,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ), 
              elevation: _turnoSelecionado == null ? 0 : 5, 
            ),
            onPressed: _turnoSelecionado == null ? null : () async {
              await pararVoz(); 
              Navigator.push(
                context, 
                MaterialPageRoute(
                  builder: (context) => TelaCadastro(
                    idEscolaSelecionada: widget.idEscola, 
                    nomeEscolaSelecionada: widget.nomeEscola, 
                    nivelSelecionado: widget.nivel,
                    turnoSelecionado: _turnoSelecionado!.turno, 
                  ),
                ),
              );
            },
            child: TextoAcessivel(
              texto: _turnoSelecionado == null 
                  ? 'Selecione um turno' 
                  : 'Quero me inscrever (${_turnoSelecionado!.turno})', 
              // <-- NOVO: Orientação de voz inteligente para o botão
              textoOcultoParaLer: _turnoSelecionado == null 
                  ? 'Por favor, selecione um turno acima para liberar a inscrição.' 
                  : 'Deseja inscrever-se no turno da ${_turnoSelecionado!.turno}? Toque aqui para preencher os seus dados.',
              corIcone: Colors.white, 
              alinhamento: TextAlign.center, 
              estilo: TextStyle(
          )),
            ),
        ),
      ),
    );
  }
}