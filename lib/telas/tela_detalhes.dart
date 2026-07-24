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
// ============================================================================
  // TRADUTOR INTELIGENTE PARA O ÁUDIO (SIGLAS E DIAS)
  // ============================================================================
  String _expandirSiglasParaAudio(String texto) {
    if (texto.isEmpty) return texto;
    String limpo = texto;

    // 1. Siglas Escolares
    limpo = limpo.replaceAll(RegExp(r'C[^\w]*E[^\w]*J[^\w]*A[^\w]*', caseSensitive: false), 'Centro de Educação de Jovens e Adultos ')
                 .replaceAll(RegExp(r'E[^\w]*B[^\w]*M[^\w]*', caseSensitive: false), 'Escola Básica Municipal ')
                 .replaceAll(RegExp(r'C[^\w]*E[^\w]*M[^\w]*', caseSensitive: false), 'Centro Educacional Municipal ')
                 .replaceAll(RegExp(r'E[^\w]*E[^\w]*B[^\w]*', caseSensitive: false), 'Escola de Educação Básica ')
                 .replaceAll(RegExp(r'E[^\w]*J[^\w]*A[^\w]*', caseSensitive: false), 'Êja ');

    // 2. Dias da Semana
    limpo = limpo
        .replaceAll('Seg', 'segunda')
        .replaceAll('Ter', 'terça')
        .replaceAll('Qua', 'quarta')
        .replaceAll('Qui', 'quinta')
        .replaceAll('Sex', 'sexta')
        .replaceAll('Sab', 'sábado')
        .replaceAll('Sáb', 'sábado')
        .replaceAll('Dom', 'domingo');

    // 3. O SEGREDO DO TRAÇO: Troca qualquer formato de traço por " a "
    limpo = limpo
        .replaceAll(' - ', ' a ')
        .replaceAll(' – ', ' a ') 
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
      _controladorDeRolagem.animateTo(
        0,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
      );
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
      await gerenciadorVoz.speak(
        "Você selecionou o turno da ${_turnoSelecionado!.turno}.",
      );
    } else {
      await gerenciadorVoz.speak(
        "Turno da ${_turnoSelecionado!.turno} selecionado.",
      );
    }
    if (!mounted || !acessibilidadeAtivada.value) return;

    // <-- LIMPA O HORÁRIO AQUI PARA NÃO LER "MENOS"
    String horarioLimpo = _turnoSelecionado!.horario
        .replaceAll(' - ', ' às ')
        .replaceAll('-', ' às ');

    // 3. AULAS, DIAS E DISTÂNCIA (O "de" já tá embutido no _traduzirParaAudio)
    await gerenciadorVoz.speak(
      "As aulas acontecem das $horarioLimpo, ${_expandirSiglasParaAudio(_turnoSelecionado!.diasAula)}. A escola está a aproximadamente ${widget.distancia} de você.",
    );
    if (!mounted || !acessibilidadeAtivada.value) return;

    // 4. AUXÍLIOS
    _controladorDeRolagem.animateTo(
      150,
      duration: const Duration(milliseconds: 600),
      curve: Curves.easeInOut,
    );
    await gerenciadorVoz.speak(
      "Possui os seguintes auxílios: ${_turnoSelecionado!.auxilios}.",
    );
    if (!mounted || !acessibilidadeAtivada.value) return;

    // 5. COMO FUNCIONA
    _controladorDeRolagem.animateTo(
      300,
      duration: const Duration(milliseconds: 600),
      curve: Curves.easeInOut,
    );
    await gerenciadorVoz.speak(
      "Nessa escola, a Êja funciona da seguinte forma: ${_turnoSelecionado!.descricao}.",
    );
    if (!mounted || !acessibilidadeAtivada.value) return;

    // 6. CONCLUSÃO
    _controladorDeRolagem.animateTo(
      _controladorDeRolagem.position.maxScrollExtent,
      duration: const Duration(milliseconds: 800),
      curve: Curves.easeInOut,
    );
    await gerenciadorVoz.speak(
      "Deseja se inscrever nessa escola? Clique no botão azul no final da tela. Caso deseje ver outra, é só voltar.",
    );
  }

  // ============================================================================
  // LÓGICA DE ÍCONES DE TURNO
  // ============================================================================
  Widget _obterIconeTurno(String turno, bool isSelected, double escalaMestre) {
    String t = turno.toLowerCase();
    Color corIconeBranco = Colors.white;

    if (t.contains('manhã') || t.contains('manha')) {
      return Icon(
        Icons.wb_sunny_rounded,
        color: isSelected ? corIconeBranco : Colors.amber.shade500,
        size: 26 * escalaMestre,
      );
    }
    if (t.contains('tarde')) {
      return Icon(
        Icons.wb_twilight_rounded,
        color: isSelected ? corIconeBranco : Colors.orange.shade500,
        size: 26 * escalaMestre,
      );
    }
    return Icon(
      Icons.nightlight_round,
      color: isSelected ? corIconeBranco : Colors.indigo.shade400,
      size: 24 * escalaMestre,
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
        explicacao:
            "Refeição nutritiva servida gratuitamente no refeitório da escola, garantindo energia para seus estudos após um dia de trabalho.",
      );
    }

    if (textoMinusculo.contains('passe') ||
        textoMinusculo.contains('transporte') ||
        textoMinusculo.contains('ônibus')) {
      return _AuxilioVisual(
        icone: Icons.directions_bus_rounded,
        corIcone: Colors.blue.shade700,
        corFundo: Colors.blue.shade50,
        explicacao:
            "Acesso a transporte escolar ou passe livre subsidiado pela prefeitura para facilitar seu deslocamento com segurança.",
      );
    }

    if (textoMinusculo.contains('material') ||
        textoMinusculo.contains('livro') ||
        textoMinusculo.contains('didático') ||
        textoMinusculo.contains('apostila')) {
      return _AuxilioVisual(
        icone: Icons.menu_book_rounded,
        corIcone: Paleta.azulIcones,
        corFundo: Paleta.azulIcones.withValues(alpha: 0.1),
        explicacao:
            "Você receberá o material didático necessário (como apostilas e cadernos) de forma 100% gratuita para acompanhar as aulas.",
      );
    }

    if (textoMinusculo.contains('uniforme') ||
        textoMinusculo.contains('roupa') ||
        textoMinusculo.contains('camisa')) {
      return _AuxilioVisual(
        icone: Icons.checkroom_rounded,
        corIcone: Colors.teal.shade600,
        corFundo: Colors.teal.shade50,
        explicacao:
            "Kit escolar de vestuário entregue gratuitamente no início do semestre para sua identificação e comodidade dentro da instituição.",
      );
    }

    return _AuxilioVisual(
      icone: Icons.check_circle_outline_rounded,
      corIcone: Paleta.azulBotao,
      corFundo: Paleta.azulBotao.withValues(alpha: 0.1),
      explicacao:
          "Detalhes específicos sobre este auxílio estarão disponíveis na secretaria da escola no ato da matrícula.",
    );
  }

  // ============================================================================
  // BOTTOM SHEET DE DETALHES DO AUXÍLIO
  // ============================================================================
  // ============================================================================
  // BOTTOM SHEET DE DETALHES DO AUXÍLIO
  // ============================================================================
  void _abrirDetalheAuxilio(
    String titulo,
    _AuxilioVisual visual,
    double escala,
  ) {
    // MÁGICA 3: Dispara o áudio automaticamente assim que o modal abre (sem travar a tela)
    if (acessibilidadeAtivada.value) {
      pararVoz().then((_) {
        gerenciadorVoz.speak("$titulo. ${visual.explicacao}");
      });
    }

    // Mecanismo para detectar se a tela se comporta como Desktop/Web Grande
    final bool modoComputador =
        MediaQuery.of(context).size.width > 1280 &&
        !(Theme.of(context).platform == TargetPlatform.android ||
            Theme.of(context).platform == TargetPlatform.iOS);

    if (modoComputador) {
      // ====================================================================
      // POP-UP CENTRALIZADO EXCLUSIVO PARA COMPUTADOR
      // ====================================================================
      showDialog(
        context: context,
        builder: (BuildContext context) {
          return Dialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
            ),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 500),
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
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
                  TextoAcessivel(
                    texto: visual.explicacao,
                    ocultarIcone: true, // Filho oculto!
                    estilo: GoogleFonts.inter(
                      fontSize: 16,
                      color: const Color(0xFF455A64),
                      height: 1.6,
                    ),
                  ),
                  const SizedBox(height: 32),
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
                      onPressed: () {
                        pararVoz(); // Para a voz ao fechar
                        Navigator.pop(context);
                      },
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
            ),
          );
        },
      );
    } else {
      // ====================================================================
      // MANTÉM O BOTTOM SHEET ORIGINAL PARA TELEFONES E TABLETS
      // ====================================================================
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
            padding: EdgeInsets.fromLTRB(
              24 * escala,
              12 * escala,
              24 * escala,
              32 * escala,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40 * escala,
                    height: 5 * escala,
                    margin: EdgeInsets.only(bottom: 24 * escala),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
                Row(
                  children: [
                    Container(
                      padding: EdgeInsets.all(12 * escala),
                      decoration: BoxDecoration(
                        color: visual.corFundo,
                        borderRadius: BorderRadius.circular(16 * escala),
                      ),
                      child: Icon(
                        visual.icone,
                        color: visual.corIcone,
                        size: 28 * escala,
                      ),
                    ),
                    SizedBox(width: 16 * escala),
                    Expanded(
                      child: TextoAcessivel(
                        texto: titulo,
                        textoOcultoParaLer: "$titulo. ${visual.explicacao}",
                        estilo: GoogleFonts.inter(
                          fontSize: 22 * escala,
                          fontWeight: FontWeight.w900,
                          color: const Color(0xFF1E1B4B),
                        ),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 20 * escala),
                TextoAcessivel(
                  texto: visual.explicacao,
                  ocultarIcone: true, // Filho oculto!
                  estilo: GoogleFonts.inter(
                    fontSize: 16 * escala,
                    color: const Color(0xFF455A64),
                    height: 1.6,
                  ),
                ),
                SizedBox(height: 30 * escala),
                SizedBox(
                  width: double.infinity,
                  height: 50 * escala,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF7C3AED),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16 * escala),
                      ),
                      elevation: 0,
                    ),
                    onPressed: () {
                      pararVoz(); // Para a voz ao fechar
                      Navigator.pop(context);
                    },
                    child: Text(
                      'Entendi',
                      style: TextStyle(
                        fontSize: 16 * escala,
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
  }

  // Método auxiliar para evitar repetição de código
  Widget _construirConteudoModal(String titulo, _AuxilioVisual visual) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
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
                child: Icon(visual.icone, color: visual.corIcone, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
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
  }

  // ============================================================================
  // MINI CARDS (Dias e Distância)
  // ============================================================================
  Widget _buildMiniCardStatus({
    required IconData icone,
    required Color corIcone,
    required Color corFundoIcone,
    required String label,
    required String texto,
    required String subTextoDica,
    double escala = 1.0,
  }) {
    return Expanded(
      child: Container(
        padding: EdgeInsets.symmetric(
          vertical: 14 * escala,
          horizontal: 8 * escala,
        ),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(
            color: const Color(0xFFEDE9FE),
            width: 1.5 * escala,
          ),
          borderRadius: BorderRadius.circular(20 * escala),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: EdgeInsets.all(6 * escala),
              decoration: BoxDecoration(
                color: corFundoIcone,
                shape: BoxShape.circle,
              ),
              child: Icon(icone, color: corIcone, size: 20 * escala),
            ),
            SizedBox(height: 8 * escala),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12 * escala,
                fontWeight: FontWeight.w700,
                color: Colors.grey.shade500,
              ),
            ),
            SizedBox(height: 4 * escala),
            Text(
              texto,
              textAlign: TextAlign.center,
              maxLines: 1,
              style: GoogleFonts.inter(
                fontSize: 15 * escala,
                fontWeight: FontWeight.w900,
                color: const Color(0xFF1E1B4B),
                height: 1.1,
              ),
            ),
            if (subTextoDica.isNotEmpty) ...[
              SizedBox(height: 2 * escala),
              Text(
                subTextoDica,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 10 * escala,
                  fontWeight: FontWeight.w500,
                  color: Colors.grey.shade400,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // ============================================================================
  // CARD MODERNO INDEPENDENTE (Auxílios e Como Funciona)
  // ============================================================================
  Widget _cardInfoModerno({
    required String titulo,
    String? textoOcultoTitulo,
    required IconData iconeHeader,
    required Color corIcone,
    required Color corFundoIcone,
    Widget? childCustom,
    String? conteudo,
    double escala = 1.0,
  }) {
    return Container(
      width: double.infinity,
      margin: EdgeInsets.only(bottom: 20 * escala),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20 * escala),
        border: Border.all(color: const Color(0xFFEDE9FE), width: 1.5 * escala),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF4F46E5).withValues(alpha: 0.04),
            blurRadius: 15 * escala,
            offset: Offset(0, 5 * escala),
          ),
        ],
      ),
      child: Padding(
        padding: EdgeInsets.all(20 * escala),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: EdgeInsets.all(10 * escala),
                  decoration: BoxDecoration(
                    color: corFundoIcone,
                    borderRadius: BorderRadius.circular(12 * escala),
                  ),
                  child: Icon(iconeHeader, color: corIcone, size: 22 * escala),
                ),
                SizedBox(width: 14 * escala),
                TextoAcessivel(
                  texto: titulo,
                  textoOcultoParaLer: textoOcultoTitulo ?? titulo,
                  estilo: GoogleFonts.inter(
                    fontSize: 18 * escala,
                    fontWeight: FontWeight.w900,
                    color: const Color(0xFF1E1B4B),
                  ),
                ),
              ],
            ),
            SizedBox(height: 16 * escala),
            childCustom ??
                TextoAcessivel(
                  texto: conteudo ?? '',
                  ocultarIcone: true, // MÁGICA 1: Esconde o ícone de áudio do texto filho!
                  estilo: GoogleFonts.inter(
                    fontSize: 15 * escala,
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
  Widget _construirListaAuxilios(
    String auxiliosRaw, [
    double escalaMestre = 1.0,
  ]) {
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
              onTap: () =>
                  _abrirDetalheAuxilio(textoLimpo, visual, escalaMestre),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  vertical: 8.0,
                  horizontal: 4.0,
                ),
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
                        ocultarIcone: true,
                        estilo: GoogleFonts.inter(
                          fontSize: 15,
                          color: const Color(0xFF1E1B4B),
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

    if (linhas.isEmpty) {
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
  Widget _buildDicaDeRolagem(double escalaMestre) {
    return AnimatedOpacity(
      opacity: _mostrarDicaRolagem ? 1.0 : 0.0,
      duration: const Duration(milliseconds: 300),
      child: Column(
        children: [
          SizedBox(height: 10 * escalaMestre),
          Text(
            "Deslize para ver tudo",
            style: GoogleFonts.inter(
              fontSize: 12 * escalaMestre,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade400,
            ),
          ),
          SizedBox(height: 4 * escalaMestre),
          FadeInDown(
            duration: const Duration(milliseconds: 1500),
            child: Icon(
              Icons.keyboard_double_arrow_down_rounded,
              color: Colors.grey.shade400,
              size: 20 * escalaMestre,
            ),
          ),
        ],
      ),
    );
  }

  // ============================================================================
  // BUILD PRINCIPAL DA TELA CONECTADO AO MOTOR DE ESCALONAMENTO
  // ============================================================================
  @override
  Widget build(BuildContext context) {
    final double paddingTopo = MediaQuery.of(context).padding.top;
    final Size screenSize = MediaQuery.of(context).size;
    final targetPlatform = Theme.of(context).platform;
    final bool isDispositivoMovel =
        targetPlatform == TargetPlatform.android ||
        targetPlatform == TargetPlatform.iOS;

    // Identificação de Tablet e cálculo de fator de escala mestre adaptável
    final bool ehTabletMovel =
        isDispositivoMovel && screenSize.shortestSide >= 550;

    double escalaMestre = 1.0;
    double larguraMaximaGaveta = 800;

    if (ehTabletMovel) {
      if (screenSize.width >= 1200 || screenSize.height >= 1800) {
        escalaMestre = 2.0; // Tablet Large
        larguraMaximaGaveta = screenSize.width * 0.85;
      } else {
        escalaMestre = 1.6; // Tablet Medium
        larguraMaximaGaveta = screenSize.width * 0.85;
      }
    }

    return Scaffold(
      backgroundColor: Paleta.azulPrincipal,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        toolbarHeight: ehTabletMovel ? 90 : 70,
        leadingWidth: ehTabletMovel ? 100 : 70,
        leading: Align(
          alignment: Alignment.centerLeft,
          child: Padding(
            padding: EdgeInsets.only(left: ehTabletMovel ? 24.0 : 16.0),
            child: SizedBox(
              width: ehTabletMovel ? 56 : 40,
              height: ehTabletMovel ? 56 : 40,
              child: IconButton(
                padding: EdgeInsets.zero,
                icon: Container(
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.arrow_back,
                    color: Colors.white,
                    size: ehTabletMovel ? 26 : 18,
                  ),
                ),
                onPressed: () async {
                  await pararVoz();
                  Navigator.pop(context);
                },
              ),
            ),
          ),
        ),
        actions: [
          Align(
            alignment: Alignment.centerRight,
            child: Container(
              margin: EdgeInsets.only(right: ehTabletMovel ? 24 : 16),
              width: ehTabletMovel ? 56 : 40,
              height: ehTabletMovel ? 56 : 40,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 4,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: BotaoAcessibilidadeGlobal(
                textoLeituraTela: "",
                acaoPersonalizada: _iniciarLeituraComRolagem,
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // ============================================================================
          // HEADER SUPERIOR ROXO (NOME DA ESCOLA E BAIRRO)
          // ============================================================================
          FadeInDown(
            duration: const Duration(milliseconds: 500),
            child: Center(
              child: Container(
                constraints: BoxConstraints(maxWidth: larguraMaximaGaveta),
                width: double.infinity,
                padding: EdgeInsets.only(
                  top: paddingTopo + (50 * escalaMestre),
                  bottom: 25 * escalaMestre,
                  left: 24 * escalaMestre,
                  right: 24 * escalaMestre,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                 children: [
                    TextoAcessivel(
                      texto: widget.nomeEscola,
                      textoOcultoParaLer: _expandirSiglasParaAudio(widget.nomeEscola), // MÁGICA AQUI: O botão local agora usa o filtro!
                      corIcone: Colors.white,
                      estilo: GoogleFonts.inter(
                        fontSize: 26 * escalaMestre,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: -0.5,
                        height: 1.1,
                      ),
                    ),
                    SizedBox(height: 6 * escalaMestre),
                    Text(
                      '${widget.bairro} • ${widget.cidade} • SC',
                      style: GoogleFonts.inter(
                        fontSize: 14 * escalaMestre,
                        color: Colors.white.withValues(alpha: 0.8),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // ============================================================================
          // ÁREA BRANCA ROLÁVEL (GAVETA DE DETALHES)
          // ============================================================================
          Expanded(
            child: Container(
              clipBehavior: Clip.antiAlias,
              decoration: BoxDecoration(
                color: Paleta.fundoGeral,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(35 * escalaMestre),
                  topRight: Radius.circular(35 * escalaMestre),
                ),
              ),
              child: Column(
                children: [
                  Center(
                    child: Container(
                      margin: EdgeInsets.only(
                        top: 16 * escalaMestre,
                        bottom: 8 * escalaMestre,
                      ),
                      width: 40 * escalaMestre,
                      height: 5 * escalaMestre,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),

                  Expanded(
                    child: ListView(
                      controller: _controladorDeRolagem,
                      padding: EdgeInsets.only(
                        top: 10,
                        bottom: 40 * escalaMestre,
                      ),
                      children: [
                        Center(
                          child: Container(
                            constraints: BoxConstraints(
                              maxWidth: larguraMaximaGaveta,
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                // ========================================================
                                // SEÇÃO 1: SELEÇÃO DE TURNO
                                // ========================================================
                                if (widget.turnos.isNotEmpty)
                                  FadeIn(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.stretch,
                                      children: [
                                        Padding(
                                          padding: EdgeInsets.only(
                                            left: 24 * escalaMestre,
                                            bottom: 16 * escalaMestre,
                                          ),
                                          child: Text(
                                            "Selecione um turno:",
                                            style: GoogleFonts.inter(
                                              fontSize: 14 * escalaMestre,
                                              fontWeight: FontWeight.bold,
                                              color: const Color(0xFF1E1B4B),
                                            ),
                                          ),
                                        ),
                                        Padding(
                                          padding: EdgeInsets.symmetric(
                                            horizontal: 24 * escalaMestre,
                                          ),
                                          child: Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: widget.turnos.map((
                                              turnoOpcao,
                                            ) {
                                              final isSelected =
                                                  _turnoSelecionado?.id ==
                                                  turnoOpcao.id;

                                              return Expanded(
                                                child: Padding(
                                                  padding: EdgeInsets.symmetric(
                                                    horizontal:
                                                        4 * escalaMestre,
                                                  ),
                                                  child: GestureDetector(
                                                    onTap: () async {
                                                      await pararVoz();
                                                      setState(() {
                                                        _turnoSelecionado =
                                                            turnoOpcao;
                                                        _mostrarDicaRolagem =
                                                            true;
                                                      });
                                                      // Atualizado com a leitura inteligente do colega
                                                      if (acessibilidadeAtivada
                                                          .value) {
                                                        _iniciarLeituraComRolagem(
                                                          lerTudo: false,
                                                        );
                                                      }
                                                    },
                                                    child: AnimatedContainer(
                                                      duration: const Duration(
                                                        milliseconds: 300,
                                                      ),
                                                      padding:
                                                          EdgeInsets.symmetric(
                                                            vertical:
                                                                14 *
                                                                escalaMestre,
                                                            horizontal: 2,
                                                          ),
                                                      decoration: BoxDecoration(
                                                        color: isSelected
                                                            ? Paleta.azulBotao
                                                            : Colors.white,
                                                        borderRadius:
                                                            BorderRadius.circular(
                                                              20 * escalaMestre,
                                                            ),
                                                        border: Border.all(
                                                          color: isSelected
                                                              ? const Color(
                                                                  0xFF4F46E5,
                                                                )
                                                              : const Color(
                                                                  0xFFEDE9FE,
                                                                ),
                                                          width:
                                                              1.5 *
                                                              escalaMestre,
                                                        ),
                                                        boxShadow: isSelected
                                                            ? [
                                                                BoxShadow(
                                                                  color: Paleta
                                                                      .azulBotao
                                                                      .withValues(
                                                                        alpha:
                                                                            0.3,
                                                                      ),
                                                                  blurRadius:
                                                                      10 *
                                                                      escalaMestre,
                                                                  offset: Offset(
                                                                    0,
                                                                    4 *
                                                                        escalaMestre,
                                                                  ),
                                                                ),
                                                              ]
                                                            : [],
                                                      ),
                                                      child: Column(
                                                        mainAxisSize:
                                                            MainAxisSize.min,
                                                        children: [
                                                          _obterIconeTurno(
                                                            turnoOpcao.turno,
                                                            isSelected,
                                                            escalaMestre,
                                                          ),
                                                          SizedBox(
                                                            height:
                                                                8 *
                                                                escalaMestre,
                                                          ),
                                                          Text(
                                                            turnoOpcao.turno,
                                                            maxLines: 1,
                                                            overflow:
                                                                TextOverflow
                                                                    .ellipsis,
                                                            textAlign: TextAlign
                                                                .center,
                                                            style: GoogleFonts.inter(
                                                              fontSize:
                                                                  12 *
                                                                  escalaMestre,
                                                              fontWeight:
                                                                  FontWeight
                                                                      .w900,
                                                              color: isSelected
                                                                  ? Colors.white
                                                                  : const Color(
                                                                      0xFF1E1B4B,
                                                                    ),
                                                            ),
                                                          ),
                                                          SizedBox(
                                                            height:
                                                                2 *
                                                                escalaMestre,
                                                          ),
                                                          Text(
                                                            turnoOpcao.horario
                                                                .replaceAll(
                                                                  ' - ',
                                                                  '-',
                                                                ),
                                                            maxLines: 1,
                                                            overflow:
                                                                TextOverflow
                                                                    .ellipsis,
                                                            textAlign: TextAlign
                                                                .center,
                                                            style: GoogleFonts.inter(
                                                              fontSize:
                                                                  9 *
                                                                  escalaMestre,
                                                              fontWeight:
                                                                  FontWeight
                                                                      .w500,
                                                              color: isSelected
                                                                  ? Colors.white
                                                                        .withValues(
                                                                          alpha:
                                                                              0.8,
                                                                        )
                                                                  : Paleta
                                                                        .textoSecundario,
                                                            ),
                                                          ),
                                                        ],
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                              );
                                            }).toList(),
                                          ),
                                        ),
                                        SizedBox(height: 20 * escalaMestre),
                                      ],
                                    ),
                                  ),

                                // ========================================================
                                // ESTADO VAZIO: AGUARDANDO SELEÇÃO DO TURNO
                                // ========================================================
                                if (_turnoSelecionado == null)
                                  FadeIn(
                                    child: Padding(
                                      padding: EdgeInsets.symmetric(
                                        horizontal: 24 * escalaMestre,
                                        vertical: 40 * escalaMestre,
                                      ),
                                      child: Column(
                                        children: [
                                          Container(
                                            padding: EdgeInsets.all(
                                              16 * escalaMestre,
                                            ),
                                            decoration: BoxDecoration(
                                              color: Paleta.azulIcones
                                                  .withValues(alpha: 0.1),
                                              shape: BoxShape.circle,
                                            ),
                                            child: Icon(
                                              Icons.school_rounded,
                                              size: 40 * escalaMestre,
                                              color: Paleta.azulIcones,
                                            ),
                                          ),
                                          SizedBox(height: 20 * escalaMestre),
                                          Text(
                                            "Escolha o melhor horário para você",
                                            textAlign: TextAlign.center,
                                            style: GoogleFonts.inter(
                                              fontSize: 18 * escalaMestre,
                                              color: const Color(0xFF1E1B4B),
                                              fontWeight: FontWeight.w900,
                                            ),
                                          ),
                                          SizedBox(height: 8 * escalaMestre),
                                          Text(
                                            "Cada turno tem seus próprios auxílios e informações exclusivas. Toque em um dos turnos acima para ver os detalhes.",
                                            textAlign: TextAlign.center,
                                            style: GoogleFonts.inter(
                                              fontSize: 14 * escalaMestre,
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
                                  // SEÇÃO DE INFORMAÇÕES
                                  // ========================================================

                                  // 1. CARDS DE DIAS E DISTÂNCIA
                                  FadeInUp(
                                    key: ValueKey(
                                      'header_${_turnoSelecionado!.id}',
                                    ),
                                    duration: const Duration(milliseconds: 400),
                                    child: Padding(
                                      padding: EdgeInsets.symmetric(
                                        horizontal: 24 * escalaMestre,
                                      ),
                                      child: IntrinsicHeight(
                                        child: Row(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.stretch,
                                          children: [
                                            _buildMiniCardStatus(
                                              icone:
                                                  Icons.calendar_month_rounded,
                                              corIcone: Colors.blue.shade600,
                                              corFundoIcone:
                                                  Colors.blue.shade50,
                                              label: 'Dias de Aula',
                                              texto:
                                                  _turnoSelecionado!.diasAula,
                                              subTextoDica: '',
                                              escala: escalaMestre,
                                            ),
                                            SizedBox(width: 12 * escalaMestre),
                                            _buildMiniCardStatus(
                                              icone: Icons.location_on_rounded,
                                              corIcone: Colors.red.shade500,
                                              corFundoIcone: Colors.red.shade50,
                                              label: 'Distância',
                                              texto: widget.distancia,
                                              subTextoDica: 'do seu local',
                                              escala: escalaMestre,
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),

                                  SizedBox(height: 25 * escalaMestre),

                                  // 2. CARD EXCLUSIVO DE AUXÍLIOS (Com leitura de todos os benefícios)
                                  FadeInUp(
                                    key: ValueKey(
                                      'aux_${_turnoSelecionado!.id}',
                                    ),
                                    duration: const Duration(milliseconds: 500),
                                    child: Padding(
                                      padding: EdgeInsets.symmetric(
                                        horizontal: 24 * escalaMestre,
                                      ),
                                      child: _cardInfoModerno(
                                        titulo: 'Auxílios',
                                        textoOcultoTitulo:
                                            'Auxílios oferecidos neste turno: ${_turnoSelecionado!.auxilios}.',
                                        iconeHeader:
                                            Icons.volunteer_activism_rounded,
                                        corIcone: const Color(0xFFD97706),
                                        corFundoIcone: const Color(0xFFFEF3C7),
                                        escala: escalaMestre,
                                        childCustom: _construirListaAuxilios(
                                          _turnoSelecionado!.auxilios,
                                          escalaMestre,
                                        ),
                                      ),
                                    ),
                                  ),

                                  // 3. CARD EXCLUSIVO DE COMO FUNCIONA
                                  FadeInUp(
                                    key: ValueKey(
                                      'info_${_turnoSelecionado!.id}',
                                    ),
                                    duration: const Duration(milliseconds: 600),
                                    child: Padding(
                                      padding: EdgeInsets.symmetric(
                                        horizontal: 24 * escalaMestre,
                                      ),
                                      child: _cardInfoModerno(
                                        titulo: 'Como funciona',
                                        textoOcultoTitulo: 'Como funciona. ${_turnoSelecionado!.descricao}', // MÁGICA 2: O Pai lê o próprio título e a descrição!
                                        iconeHeader: Icons.info_outline_rounded,
                                        corIcone: const Color(0xFF2563EB),
                                        corFundoIcone: const Color(0xFFEFF6FF),
                                        escala: escalaMestre,
                                        conteudo: _turnoSelecionado!.descricao,
                                      ),
                                    ),
                                  ),

                                  _buildDicaDeRolagem(escalaMestre),
                                ],
                              ],
                            ),
                          ),
                        ),
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
        padding: EdgeInsets.only(
          left: 24 * escalaMestre,
          right: 24 * escalaMestre,
          top: 10 * escalaMestre,
          bottom: 30 * escalaMestre,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(
              width: MediaQuery.of(context).size.width > 448
                  ? 400 * (escalaMestre > 1.0 ? 1.4 : 1.0)
                  : MediaQuery.of(context).size.width - 48,
              height: 60 * (escalaMestre > 1.0 ? 1.2 : 1.0),
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _turnoSelecionado == null
                      ? Colors.grey.shade300
                      : Paleta.azulBotao,
                  disabledBackgroundColor: Colors.grey.shade300,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20 * escalaMestre),
                  ),
                  elevation: _turnoSelecionado == null ? 0 : 5,
                ),
                onPressed: _turnoSelecionado == null
                    ? null
                    : () async {
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
                        ).then(
                          (_) => falarAoVoltar(
                            "Retornamos para a tela de detalhes da escola. Deseja realizar a inscrição?",
                          ),
                        );
                      },
                child: TextoAcessivel(
                  texto: _turnoSelecionado == null
                      ? 'Selecione um turno'
                      : 'Quero me inscrever (${_turnoSelecionado!.turno})',
                  textoOcultoParaLer: _turnoSelecionado == null
                      ? 'Por favor, selecione um turno acima para liberar a inscrição.'
                      : 'Deseja inscrever-se no turno da ${_turnoSelecionado!.turno}? Toque aqui para preencher os seus dados.',
                  corIcone: Colors.white,
                  alinhamento: TextAlign.center,
                  estilo: TextStyle(
                    color: _turnoSelecionado == null
                        ? Colors.grey.shade500
                        : Colors.white,
                    fontSize: 16 * escalaMestre,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
