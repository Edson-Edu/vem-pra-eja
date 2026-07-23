import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import 'package:flutter/services.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'tela_sucesso.dart';
import '../paleta.dart';
import '../leitor_texto.dart';

class TelaCadastro extends StatefulWidget {
  final String idEscolaSelecionada;
  final String nomeEscolaSelecionada;
  final String nivelSelecionado;
  final String turnoSelecionado;

  const TelaCadastro({
    super.key,
    required this.idEscolaSelecionada,
    required this.nomeEscolaSelecionada,
    required this.nivelSelecionado,
    required this.turnoSelecionado,
  });

  @override
  State<TelaCadastro> createState() => _TelaCadastroState();
}

class _TelaCadastroState extends State<TelaCadastro> {
  final _formContato = GlobalKey<FormState>();
  final _formEndereco = GlobalKey<FormState>();

  final TextEditingController _nomeCtrl = TextEditingController();
  final TextEditingController _cpfCtrl = TextEditingController();
  final TextEditingController _dddCtrl = TextEditingController();
  final TextEditingController _numeroCtrl = TextEditingController();
  final TextEditingController _emailCtrl = TextEditingController();

  final TextEditingController _cepCtrl = TextEditingController();
  final TextEditingController _ruaCtrl = TextEditingController();
  final TextEditingController _bairroCtrl = TextEditingController();
  final TextEditingController _numeroEndCtrl = TextEditingController();

  final FocusNode _focoNome = FocusNode();
  final FocusNode _focoCpf = FocusNode();
  final FocusNode _focoIdade = FocusNode();
  final FocusNode _focoDdd = FocusNode();
  final FocusNode _focoNumero = FocusNode();
  final FocusNode _focoEmail = FocusNode();
  final FocusNode _focoCep = FocusNode();
  final FocusNode _focoRua = FocusNode();
  final FocusNode _focoBairro = FocusNode();
  final FocusNode _focoNumeroEndereco = FocusNode();

  // Controladores dedicados ao Autocomplete da Rua para evitar o erro de assertion
  final TextEditingController _autocompleteTextCtrl = TextEditingController();
  final FocusNode _autocompleteFocusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _configurarLeituraGuiada();

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final double width = MediaQuery.of(context).size.width;
      final targetPlatform = Theme.of(context).platform;
      final bool isDispositivoMovel =
          targetPlatform == TargetPlatform.android ||
          targetPlatform == TargetPlatform.iOS;

      if (!isDispositivoMovel && width > 1280) {
        setState(() {
          _contatoAberto = true;
          _enderecoAberto = true;
        });
      }

      if (acessibilidadeAtivada.value) {
        await pararVoz();
        await gerenciadorVoz.speak(
          "Você está se inscrevendo na escola ${widget.nomeEscolaSelecionada}, "
          "no nível ${widget.nivelSelecionado} e no turno ${widget.turnoSelecionado}. "
          "Preencha os dados de contato abaixo.",
        );
        await gerenciadorVoz.aguardarFilaTerminar();
        if (mounted) {
          FocusScope.of(context).requestFocus(_focoNome);
        }
      }
    });
  }

  // ==========================================================
  // O MOTOR DO TOUR GUIADO (ÁUDIO E FOCO)
  // ==========================================================
  void _configurarLeituraGuiada() {
    _vincularAudio(
      _focoNome,
      "Campo selecionado: Nome Completo. Digite seu nome e toque em avançar no teclado.",
    );
    _vincularAudio(_focoCpf, "Campo: CPF. Digite apenas os números.");
    _vincularAudio(_focoIdade, "Campo: Idade.");
    _vincularAudio(_focoDdd, "Campo: DDD. Exemplo: 4 7.");
    _vincularAudio(
      _focoNumero,
      "Campo: Telefone WhatsApp. Digite apenas números.",
    );
    _vincularAudio(_focoEmail, "Campo: E-mail. Este campo é opcional.");
    _vincularAudio(
      _focoCep,
      "Campo: CEP. Digite o CEP para buscar a rua automaticamente.",
    );
    _vincularAudio(
      _focoRua,
      "Campo: Rua. Você também pode digitar o nome da rua aqui para buscar.",
    );
    _vincularAudio(_focoBairro, "Campo: Bairro.");
    _vincularAudio(
      _focoNumeroEndereco,
      "Campo: Número da casa. Deixe em branco se não houver.",
    );
  }

  void _vincularAudio(FocusNode node, String texto) {
    node.addListener(() async {
      if (node.hasFocus && acessibilidadeAtivada.value) {
        await pararVoz();
        await Future.delayed(const Duration(milliseconds: 250));
        await configurarTts();
        await gerenciadorVoz.speak(texto);
      }
    });
  }

  final TextEditingController _idadeCtrl = TextEditingController();

  bool _buscando = false;
  bool _camposEndTravados = false;
  String _cidadeSelecionada = 'Camboriú';

  bool _contatoAberto = true;
  bool _enderecoAberto = false;

  bool _enviandoDados = false;

  final List<String> _cidadesPermitidas = ['Camboriú', 'Balneário Camboriú'];

  bool get _contatoPreenchido {
    return _nomeCtrl.text.isNotEmpty &&
        _cpfCtrl.text.length == 14 &&
        _idadeCtrl.text.isNotEmpty &&
        _dddCtrl.text.length == 2 &&
        _numeroCtrl.text.length >= 10;
  }

  bool get _enderecoPreenchido {
    return _cepCtrl.text.length == 9 &&
        _ruaCtrl.text.isNotEmpty &&
        _bairroCtrl.text.isNotEmpty &&
        _cidadeSelecionada.isNotEmpty;
  }

  bool get _enderecoVazio {
    return _cepCtrl.text.isEmpty && _ruaCtrl.text.isEmpty;
  }

  @override
  void dispose() {
    pararVoz();
    _nomeCtrl.dispose();
    _cpfCtrl.dispose();
    _dddCtrl.dispose();
    _numeroCtrl.dispose();
    _emailCtrl.dispose();
    _cepCtrl.dispose();
    _ruaCtrl.dispose();
    _bairroCtrl.dispose();
    _numeroEndCtrl.dispose();
    _focoDdd.dispose();
    _focoNumero.dispose();
    _focoNumeroEndereco.dispose();
    _idadeCtrl.dispose();
    _focoNome.dispose();
    _focoCpf.dispose();
    _focoIdade.dispose();
    _focoEmail.dispose();
    _focoCep.dispose();
    _focoRua.dispose();
    _focoBairro.dispose();
    _autocompleteTextCtrl.dispose();
    _autocompleteFocusNode.dispose();
    super.dispose();
  }

  bool _isCpfValido(String cpf) {
    cpf = cpf.replaceAll(RegExp(r'\D'), '');
    if (cpf.length != 11 || RegExp(r'^(\d)\1*$').hasMatch(cpf)) {
      return false;
    }
    List<int> digitos = cpf.split('').map(int.parse).toList();
    int calc1 = 0;
    int calc2 = 0;

    for (int i = 0; i < 9; i++) {
      calc1 += digitos[i] * (10 - i);
    }
    calc1 = (calc1 * 10) % 11;
    if (calc1 == 10) calc1 = 0;
    if (calc1 != digitos[9]) return false;

    for (int i = 0; i < 10; i++) {
      calc2 += digitos[i] * (11 - i);
    }
    calc2 = (calc2 * 10) % 11;
    if (calc2 == 10) calc2 = 0;

    return calc2 == digitos[10];
  }

  bool _validarCidadePermitida(String cidade) {
    return _cidadesPermitidas.any(
      (element) => element.toLowerCase() == cidade.toLowerCase(),
    );
  }

  Future<void> _buscarPorCep(String cep) async {
    String cleanCep = cep.replaceAll(RegExp(r'\D'), '');
    if (cleanCep.length != 8) return;

    setState(() {
      _buscando = true;
    });

    try {
      final resposta = await http.get(
        Uri.parse('https://viacep.com.br/ws/$cleanCep/json/'),
      );

      if (resposta.statusCode == 200) {
        final dados = json.decode(resposta.body);

        if (dados['erro'] == null) {
          String cidadeRetornada = dados['localidade'];

          if (_validarCidadePermitida(cidadeRetornada)) {
            setState(() {
              _ruaCtrl.text = dados['logradouro'] ?? '';
              _bairroCtrl.text = dados['bairro'] ?? '';
              _cidadeSelecionada = _cidadesPermitidas.firstWhere(
                (c) => c.toLowerCase() == cidadeRetornada.toLowerCase(),
              );
              _camposEndTravados = true;
              FocusScope.of(context).requestFocus(_focoNumeroEndereco);
            });
          } else {
            _mostrarErro(
              'Inscrições limitadas a Camboriú e Balneário Camboriú.',
            );
            _resetarEndereco();
          }
        }
      }
    } catch (e) {
      debugPrint('Erro CEP: $e');
    } finally {
      setState(() {
        _buscando = false;
      });
    }
  }

  Future<Iterable<Map<String, String>>> _sugerirRuasGlobal(String termo) async {
    if (termo.length < 3 || _camposEndTravados) return const Iterable.empty();

    setState(() {
      _buscando = true;
    });
    List<Map<String, String>> resultados = [];

    try {
      for (String cidade in _cidadesPermitidas) {
        String cidadeUrl = cidade.replaceAll(' ', '%20');
        final resposta = await http.get(
          Uri.parse('https://viacep.com.br/ws/SC/$cidadeUrl/$termo/json/'),
        );

        if (resposta.statusCode == 200) {
          final List dados = json.decode(resposta.body);

          for (var item in dados) {
            String cidadeRealViaCep = item['localidade'] ?? '';

            if (_validarCidadePermitida(cidadeRealViaCep)) {
              String cidadeFormatada = _cidadesPermitidas.firstWhere(
                (c) => c.toLowerCase() == cidadeRealViaCep.toLowerCase(),
              );
              bool jaAdicionado = resultados.any(
                (r) => r['cep'] == item['cep'],
              );

              if (!jaAdicionado) {
                resultados.add({
                  'rua': item['logradouro'],
                  'bairro': item['bairro'],
                  'cep': item['cep'],
                  'cidade': cidadeFormatada,
                });
              }
            }
          }
        }
      }
    } catch (e) {
      debugPrint('Erro Sugestão: $e');
    } finally {
      setState(() {
        _buscando = false;
      });
    }

    return resultados;
  }

  void _resetarEndereco() {
    setState(() {
      _cepCtrl.clear();
      _ruaCtrl.clear();
      _bairroCtrl.clear();
      _camposEndTravados = false;
    });
  }

  void _mostrarErro(String msg) async {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: Colors.red.shade700),
    );

    if (acessibilidadeAtivada.value) {
      await pararVoz();
      await configurarTts();
      await gerenciadorVoz.speak("Atenção: $msg");
    }
  }

  Future<void> _enviarInscricao() async {
    setState(() {
      _enviandoDados = true;
    });

    try {
      await Supabase.instance.client.from('inscricoes').insert({
        'escola_id': widget.idEscolaSelecionada,
        'nivel_selecionado': widget.nivelSelecionado,
        'turno_selecionado': widget.turnoSelecionado,
        'nome_completo': _nomeCtrl.text,
        'cpf': _cpfCtrl.text.replaceAll(RegExp(r'\D'), ''),
        'idade': int.tryParse(_idadeCtrl.text),
        'ddd': _dddCtrl.text,
        'telefone': _numeroCtrl.text.replaceAll(RegExp(r'\D'), ''),
        'email_aluno': _emailCtrl.text.isEmpty ? null : _emailCtrl.text,
        'cidade': _cidadeSelecionada,
        'cep': _cepCtrl.text.replaceAll(RegExp(r'\D'), ''),
        'rua': _ruaCtrl.text,
        'bairro': _bairroCtrl.text,
        'numero_endereco': _numeroEndCtrl.text.isEmpty
            ? null
            : _numeroEndCtrl.text,
      });

      pararVoz();
      if (mounted) {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (context) => const TelaSucesso()),
          (route) => false,
        );
      }
    } catch (e) {
      debugPrint('Erro ao salvar no banco: $e');
      String msgErro = 'Ocorreu um erro ao enviar sua inscrição.';

      if (e.toString().contains('cpf_escola_turno_unico') ||
          e.toString().contains('unique constraint')) {
        msgErro =
            'Você já realizou uma pré-inscrição nesta escola para este turno!';
      }

      _mostrarErro(msgErro);
    } finally {
      if (mounted) {
        setState(() {
          _enviandoDados = false;
        });
      }
    }
  }

  InputDecoration _obterEstiloInput(String rotulo, String dica) {
    return InputDecoration(
      labelText: rotulo,
      hintText: dica,
      isDense: true,
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(15)),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(15),
        borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2.5),
      ),
    );
  }

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

    double larguraMaximaFormulario = ehTabletReal
        ? screenSize.width * 0.85
        : 500;
    if (ehTelaGrandeComputador) {
      larguraMaximaFormulario = 1280;
    }

    return Scaffold(
      backgroundColor: Paleta.fundoCadastro,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        toolbarHeight: ehTabletReal ? 120 : 80,
        leadingWidth: ehTabletReal ? 110 : 75,
        leading: Center(
          child: SizedBox(
            width: ehTabletReal ? 70 : 45,
            height: ehTabletReal ? 70 : 45,
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
                  color: const Color.fromARGB(255, 0, 0, 0),
                  size: ehTabletReal ? 32 : 20,
                ),
              ),
              onPressed: () {
                pararVoz();
                Navigator.pop(context);
              },
            ),
          ),
        ),
        actions: [
          Container(
            margin: EdgeInsets.only(right: ehTabletReal ? 20 : 12),
            width: ehTabletReal ? 70 : 44,
            height: ehTabletReal ? 70 : 44,
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
            child: const BotaoAcessibilidadeGlobal(
              textoLeituraTela: "Formulário de inscrição.",
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const TelaSucesso()),
              );
            },
            child: Text(
              'PULAR',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: ehTabletReal ? 20 : 14,
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Center(
            child: Container(
              constraints: BoxConstraints(maxWidth: larguraMaximaFormulario),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  FadeInDown(
                    child: Column(
                      children: [
                        TextoAcessivel(
                          texto: 'Você está se inscrevendo na escola',
                          estilo: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Paleta.textoSubtituloCadastro,
                          ),
                        ),
                        const SizedBox(height: 4),
                        TextoAcessivel(
                          texto: widget.nomeEscolaSelecionada,
                          alinhamento: TextAlign.center,
                          estilo: GoogleFonts.inter(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: Paleta.textoTituloCadastro,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: Paleta.fundoTagNivelCadastro,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                'Nível: ${widget.nivelSelecionado}',
                                style: const TextStyle(
                                  color: Paleta.textoTagNivelCadastro,
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: Paleta.fundoTagTurnoCadastro,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                'Turno: ${widget.turnoSelecionado}',
                                style: const TextStyle(
                                  color: Paleta.textoTagTurnoCadastro,
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                      ],
                    ),
                  ),

                  // ============================================================================
                  // BLOCO 1: DADOS DE CONTATO
                  // ============================================================================
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Paleta.sombraFormularioCadastro.withValues(
                            alpha: 0.05,
                          ),
                          blurRadius: 15,
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        InkWell(
                          onTap: () {
                            if (ehTelaGrandeComputador) return;
                            setState(() {
                              _contatoAberto = !_contatoAberto;
                              if (_contatoAberto) _enderecoAberto = false;
                            });
                          },
                          borderRadius: BorderRadius.circular(20),
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.person_outline_rounded,
                                  color: Paleta.iconeAcaoCadastro,
                                  size: 24,
                                ),
                                const SizedBox(width: 10),
                                TextoAcessivel(
                                  texto: 'DADOS DE CONTATO',
                                  textoOcultoParaLer:
                                      'Seção Dados de contato. Preencha seus dados pessoais abaixo. Toque na primeira caixa, Nome Completo, para iniciar.',
                                  estilo: GoogleFonts.inter(
                                    fontWeight: FontWeight.bold,
                                    color: Paleta.textoTituloCadastro,
                                  ),
                                ),
                                const Spacer(),
                                if (!_contatoAberto && !_contatoPreenchido)
                                  const Padding(
                                    padding: EdgeInsets.only(right: 12.0),
                                    child: Icon(
                                      Icons.error_outline_rounded,
                                      color: Colors.orange,
                                      size: 20,
                                    ),
                                  ),
                                if (!ehTelaGrandeComputador)
                                  Icon(
                                    _contatoAberto
                                        ? Icons.keyboard_arrow_up_rounded
                                        : Icons.keyboard_arrow_down_rounded,
                                    color: Colors.grey,
                                    size: 24,
                                  ),
                              ],
                            ),
                          ),
                        ),
                        Offstage(
                          offstage: !_contatoAberto && !ehTelaGrandeComputador,
                          child: Form(
                            key: _formContato,
                            onChanged: () => setState(() {}),
                            child: Padding(
                              padding: const EdgeInsets.only(
                                left: 16,
                                right: 16,
                                bottom: 16,
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 10),
                                  DestaqueTutorial(
                                    focusNode: _focoNome,
                                    child: TextFormField(
                                      controller: _nomeCtrl,
                                      focusNode: _focoNome,
                                      textInputAction: TextInputAction.next,
                                      onFieldSubmitted: (_) => FocusScope.of(
                                        context,
                                      ).requestFocus(_focoCpf),
                                      decoration: _obterEstiloInput(
                                        'Nome Completo',
                                        'Digite seu nome',
                                      ),
                                      validator: (v) => v == null || v.isEmpty
                                          ? 'Nome é obrigatório'
                                          : null,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Expanded(
                                        flex: 7,
                                        child: DestaqueTutorial(
                                          focusNode: _focoCpf,
                                          child: TextFormField(
                                            controller: _cpfCtrl,
                                            focusNode: _focoCpf,
                                            textInputAction:
                                                TextInputAction.next,
                                            onFieldSubmitted: (_) =>
                                                FocusScope.of(
                                                  context,
                                                ).requestFocus(_focoIdade),
                                            keyboardType: TextInputType.number,
                                            inputFormatters: [MascaraCPF()],
                                            decoration: _obterEstiloInput(
                                              'CPF (Obrigatório)',
                                              '000.000.000-00',
                                            ),
                                            validator: (v) =>
                                                (v == null || v.isEmpty)
                                                ? 'Digite o CPF'
                                                : (!_isCpfValido(v)
                                                      ? 'CPF Inválido'
                                                      : null),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        flex: 3,
                                        child: DestaqueTutorial(
                                          focusNode: _focoIdade,
                                          child: TextFormField(
                                            controller: _idadeCtrl,
                                            focusNode: _focoIdade,
                                            textInputAction:
                                                TextInputAction.next,
                                            onFieldSubmitted: (_) =>
                                                FocusScope.of(
                                                  context,
                                                ).requestFocus(_focoDdd),
                                            keyboardType: TextInputType.number,
                                            inputFormatters: [
                                              LengthLimitingTextInputFormatter(
                                                2,
                                              ),
                                            ],
                                            decoration: InputDecoration(
                                              labelText: 'Idade',
                                              hintText: '',
                                              counterText: '',
                                              isDense: true,
                                              filled: true,
                                              fillColor: Colors.white,
                                              border: OutlineInputBorder(
                                                borderRadius:
                                                    BorderRadius.circular(15),
                                              ),
                                              focusedBorder: OutlineInputBorder(
                                                borderRadius:
                                                    BorderRadius.circular(15),
                                                borderSide: const BorderSide(
                                                  color: Color(0xFF6366F1),
                                                  width: 2.5,
                                                ),
                                              ),
                                            ),
                                            validator: (v) {
                                              if (v == null || v.isEmpty)
                                                return 'Falta';
                                              int? idade = int.tryParse(v);
                                              if (idade == null) return 'Erro';
                                              if (widget.nivelSelecionado
                                                      .contains(
                                                        'Fundamental',
                                                      ) &&
                                                  idade < 15)
                                                return 'Mín 15';
                                              if (widget.nivelSelecionado
                                                      .contains('Médio') &&
                                                  idade < 18)
                                                return 'Mín 18';
                                              return null;
                                            },
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        margin: const EdgeInsets.only(top: 2),
                                        padding: const EdgeInsets.all(10),
                                        decoration: const BoxDecoration(
                                          color: Color(0xFFEDE9FE),
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(
                                          Icons.chat_bubble_rounded,
                                          color: Paleta.iconeAcaoCadastro,
                                          size: 24,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      SizedBox(
                                        width: 75,
                                        child: DestaqueTutorial(
                                          focusNode: _focoDdd,
                                          child: TextFormField(
                                            controller: _dddCtrl,
                                            focusNode: _focoDdd,
                                            textInputAction:
                                                TextInputAction.next,
                                            keyboardType: TextInputType.number,
                                            maxLength: 2,
                                            textAlign: TextAlign.center,
                                            inputFormatters: [
                                              LengthLimitingTextInputFormatter(
                                                2,
                                              ),
                                            ],
                                            decoration: InputDecoration(
                                              labelText: 'DDD',
                                              hintText: '00',
                                              counterText: '',
                                              isDense: true,
                                              filled: true,
                                              fillColor: Colors.white,
                                              border: OutlineInputBorder(
                                                borderRadius:
                                                    BorderRadius.circular(15),
                                              ),
                                              focusedBorder: OutlineInputBorder(
                                                borderRadius:
                                                    BorderRadius.circular(15),
                                                borderSide: const BorderSide(
                                                  color: Color(0xFF6366F1),
                                                  width: 2.5,
                                                ),
                                              ),
                                            ),
                                            onChanged: (v) {
                                              if (v.length == 2)
                                                FocusScope.of(
                                                  context,
                                                ).requestFocus(_focoNumero);
                                            },
                                            onFieldSubmitted: (_) =>
                                                FocusScope.of(
                                                  context,
                                                ).requestFocus(_focoNumero),
                                            validator: (v) =>
                                                v == null || v.length < 2
                                                ? 'Erro'
                                                : null,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: DestaqueTutorial(
                                          focusNode: _focoNumero,
                                          child: TextFormField(
                                            controller: _numeroCtrl,
                                            focusNode: _focoNumero,
                                            textInputAction:
                                                TextInputAction.next,
                                            onFieldSubmitted: (_) =>
                                                FocusScope.of(
                                                  context,
                                                ).requestFocus(_focoEmail),
                                            keyboardType: TextInputType.number,
                                            inputFormatters: [
                                              MascaraWhatsApp(),
                                            ],
                                            decoration: _obterEstiloInput(
                                              'Telefone (WhatsApp)',
                                              '00000-0000',
                                            ),
                                            validator: (v) =>
                                                v == null || v.length < 10
                                                ? 'Telefone incompleto'
                                                : null,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  DestaqueTutorial(
                                    focusNode: _focoEmail,
                                    child: TextFormField(
                                      controller: _emailCtrl,
                                      focusNode: _focoEmail,
                                      textInputAction: TextInputAction.done,
                                      keyboardType: TextInputType.emailAddress,
                                      decoration: _obterEstiloInput(
                                        'E-mail (Opcional)',
                                        'exemplo@email.com',
                                      ),
                                      validator: (v) =>
                                          (v != null &&
                                              v.isNotEmpty &&
                                              !v.contains('@'))
                                          ? 'E-mail inválido'
                                          : null,
                                    ),
                                  ),

                                  if (!ehTelaGrandeComputador) ...[
                                    const SizedBox(height: 15),
                                    Align(
                                      alignment: Alignment.centerRight,
                                      child: TextButton.icon(
                                        onPressed: () {
                                          if (_formContato.currentState!
                                              .validate()) {
                                            FocusScope.of(context).unfocus();
                                            setState(() {
                                              _contatoAberto = false;
                                              _enderecoAberto = true;
                                            });
                                          } else {
                                            _mostrarErro(
                                              'Verifique os campos em vermelho antes de avançar.',
                                            );
                                          }
                                        },
                                        icon: const Icon(
                                          Icons.arrow_downward_rounded,
                                          size: 18,
                                          color: Paleta.iconeAcaoCadastro,
                                        ),
                                        label: const Text(
                                          'Continuar para Endereço',
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            color: Paleta.iconeAcaoCadastro,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 15),

                  // ============================================================================
                  // BLOCO 2: ENDEREÇO
                  // ============================================================================
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Paleta.iconeAcaoCadastro.withValues(
                            alpha: 0.05,
                          ),
                          blurRadius: 15,
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        InkWell(
                          onTap: () {
                            if (ehTelaGrandeComputador) return;
                            setState(() {
                              _enderecoAberto = !_enderecoAberto;
                              if (_enderecoAberto) _contatoAberto = false;
                            });
                          },
                          borderRadius: BorderRadius.circular(20),
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.location_on_outlined,
                                  color: Paleta.iconeAcaoCadastro,
                                  size: 24,
                                ),
                                const SizedBox(width: 10),
                                TextoAcessivel(
                                  texto: 'ENDEREÇO (Opcional)',
                                  textoOcultoParaLer:
                                      'Seção Endereço. Digite seu CEP ou pesquise pelo nome da rua na segunda caixa.',
                                  estilo: GoogleFonts.inter(
                                    fontWeight: FontWeight.bold,
                                    color: Paleta.textoTituloCadastro,
                                  ),
                                ),
                                const Spacer(),
                                if (!_enderecoAberto &&
                                    !_enderecoPreenchido &&
                                    !_enderecoVazio)
                                  const Padding(
                                    padding: EdgeInsets.only(right: 12.0),
                                    child: Icon(
                                      Icons.error_outline_rounded,
                                      color: Colors.orange,
                                      size: 20,
                                    ),
                                  ),
                                if (!ehTelaGrandeComputador)
                                  Icon(
                                    _enderecoAberto
                                        ? Icons.keyboard_arrow_up_rounded
                                        : Icons.keyboard_arrow_down_rounded,
                                    color: Colors.grey,
                                    size: 24,
                                  ),
                              ],
                            ),
                          ),
                        ),
                        Offstage(
                          offstage: !_enderecoAberto && !ehTelaGrandeComputador,
                          child: Form(
                            key: _formEndereco,
                            child: Padding(
                              padding: const EdgeInsets.only(
                                left: 16,
                                right: 16,
                                bottom: 16,
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 10),
                                  DropdownButtonFormField<String>(
                                    value: _cidadeSelecionada,
                                    decoration: InputDecoration(
                                      labelText: 'Cidade',
                                      isDense: true,
                                      filled: true,
                                      fillColor: Colors.white,
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(15),
                                      ),
                                    ),
                                    items: _cidadesPermitidas
                                        .map(
                                          (c) => DropdownMenuItem(
                                            value: c,
                                            child: Text(c),
                                          ),
                                        )
                                        .toList(),
                                    onChanged: (v) {
                                      setState(() {
                                        _cidadeSelecionada = v!;
                                      });
                                    },
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: DestaqueTutorial(
                                          focusNode: _focoCep,
                                          child: TextFormField(
                                            controller: _cepCtrl,
                                            focusNode: _focoCep,
                                            textInputAction:
                                                TextInputAction.next,
                                            onFieldSubmitted: (_) =>
                                                FocusScope.of(
                                                  context,
                                                ).requestFocus(_focoRua),
                                            keyboardType: TextInputType.number,
                                            inputFormatters: [MascaraCEP()],
                                            decoration: InputDecoration(
                                              labelText: 'Buscar CEP',
                                              hintText: '00000-000',
                                              isDense: true,
                                              filled: true,
                                              fillColor: Colors.white,
                                              border: OutlineInputBorder(
                                                borderRadius:
                                                    BorderRadius.circular(15),
                                              ),
                                              focusedBorder: OutlineInputBorder(
                                                borderRadius:
                                                    BorderRadius.circular(15),
                                                borderSide: const BorderSide(
                                                  color: Color(0xFF6366F1),
                                                  width: 2.5,
                                                ),
                                              ),
                                              suffixIcon: _buscando
                                                  ? const Padding(
                                                      padding: EdgeInsets.all(
                                                        12,
                                                      ),
                                                      child: CircularProgressIndicator(
                                                        strokeWidth: 2,
                                                        valueColor:
                                                            AlwaysStoppedAnimation<
                                                              Color
                                                            >(
                                                              Paleta
                                                                  .iconeAcaoCadastro,
                                                            ),
                                                      ),
                                                    )
                                                  : null,
                                            ),
                                            onChanged: (v) {
                                              setState(() {});
                                              if (v.length == 9)
                                                _buscarPorCep(v);
                                            },
                                            validator: (v) =>
                                                v == null || v.isEmpty
                                                ? 'CEP obrigatório'
                                                : null,
                                          ),
                                        ),
                                      ),
                                      if (_camposEndTravados)
                                        Padding(
                                          padding: const EdgeInsets.only(
                                            left: 8,
                                          ),
                                          child: IconButton(
                                            onPressed: _resetarEndereco,
                                            icon: const Icon(
                                              Icons.edit_rounded,
                                              color: Paleta.iconeAcaoCadastro,
                                            ),
                                            tooltip: 'Editar Endereço',
                                          ),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  DestaqueTutorial(
                                    focusNode: _focoRua,
                                    child: RawAutocomplete<Map<String, String>>(
                                      textEditingController:
                                          _autocompleteTextCtrl,
                                      focusNode: _autocompleteFocusNode,
                                      optionsBuilder:
                                          (TextEditingValue textEditingValue) =>
                                              _sugerirRuasGlobal(
                                                textEditingValue.text,
                                              ),
                                      displayStringForOption: (option) =>
                                          option['rua']!,
                                      onSelected:
                                          (Map<String, String> selection) {
                                            setState(() {
                                              _ruaCtrl.text = selection['rua']!;
                                              _bairroCtrl.text =
                                                  selection['bairro']!;
                                              _cepCtrl.text = selection['cep']!;
                                              _cidadeSelecionada =
                                                  selection['cidade']!;
                                              _camposEndTravados = true;
                                              FocusScope.of(
                                                context,
                                              ).requestFocus(
                                                _focoNumeroEndereco,
                                              );
                                            });
                                          },
                                      fieldViewBuilder:
                                          (
                                            context,
                                            controller,
                                            focusNode,
                                            onFieldSubmitted,
                                          ) {
                                            if (controller.text.isEmpty &&
                                                _ruaCtrl.text.isNotEmpty) {
                                              controller.text = _ruaCtrl.text;
                                            }
                                            return TextFormField(
                                              controller: controller,
                                              focusNode: focusNode,
                                              textInputAction:
                                                  TextInputAction.next,
                                              onFieldSubmitted: (_) =>
                                                  FocusScope.of(
                                                    context,
                                                  ).requestFocus(_focoBairro),
                                              readOnly:
                                                  _camposEndTravados ||
                                                  _buscando,
                                              decoration: InputDecoration(
                                                labelText: 'Buscar Rua',
                                                hintText: _buscando
                                                    ? 'Localizando endereço...'
                                                    : 'Digite o nome da rua...',
                                                isDense: true,
                                                filled: true,
                                                fillColor:
                                                    _camposEndTravados ||
                                                        _buscando
                                                    ? Colors.grey.shade100
                                                    : Colors.white,
                                                border: OutlineInputBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(15),
                                                ),
                                                focusedBorder:
                                                    OutlineInputBorder(
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                            15,
                                                          ),
                                                      borderSide:
                                                          const BorderSide(
                                                            color: Color(
                                                              0xFF6366F1,
                                                            ),
                                                            width: 2.5,
                                                          ),
                                                    ),
                                                suffixIcon: const Icon(
                                                  Icons.search_rounded,
                                                  size: 20,
                                                ),
                                              ),
                                              validator: (v) =>
                                                  v == null || v.isEmpty
                                                  ? 'Rua obrigatória'
                                                  : null,
                                            );
                                          },
                                      optionsViewBuilder:
                                          (context, onSelected, options) {
                                            return Align(
                                              alignment: Alignment.topLeft,
                                              child: Material(
                                                elevation: 4.0,
                                                borderRadius:
                                                    BorderRadius.circular(15),
                                                child: Container(
                                                  width:
                                                      larguraMaximaFormulario -
                                                      72,
                                                  constraints:
                                                      const BoxConstraints(
                                                        maxHeight: 250,
                                                      ),
                                                  child: ListView.builder(
                                                    padding: EdgeInsets.zero,
                                                    shrinkWrap: true,
                                                    itemCount: options.length,
                                                    itemBuilder: (context, index) {
                                                      final option = options
                                                          .elementAt(index);
                                                      return ListTile(
                                                        title: Text(
                                                          option['rua']!,
                                                          style:
                                                              const TextStyle(
                                                                fontWeight:
                                                                    FontWeight
                                                                        .bold,
                                                                fontSize: 14,
                                                              ),
                                                        ),
                                                        subtitle: Text(
                                                          "${option['bairro']} - ${option['cidade']}",
                                                          style:
                                                              const TextStyle(
                                                                fontSize: 12,
                                                              ),
                                                        ),
                                                        onTap: () =>
                                                            onSelected(option),
                                                      );
                                                    },
                                                  ),
                                                ),
                                              ),
                                            );
                                          },
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      Expanded(
                                        flex: 2,
                                        child: DestaqueTutorial(
                                          focusNode: _focoBairro,
                                          child: TextFormField(
                                            controller: _bairroCtrl,
                                            focusNode: _focoBairro,
                                            textInputAction:
                                                TextInputAction.next,
                                            onFieldSubmitted: (_) =>
                                                FocusScope.of(
                                                  context,
                                                ).requestFocus(
                                                  _focoNumeroEndereco,
                                                ),
                                            readOnly: _camposEndTravados,
                                            decoration: _obterEstiloInput(
                                              'Bairro',
                                              '',
                                            ),
                                            validator: (v) =>
                                                v == null || v.isEmpty
                                                ? 'Bairro obrigatório'
                                                : null,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        flex: 1,
                                        child: DestaqueTutorial(
                                          focusNode: _focoNumeroEndereco,
                                          child: TextFormField(
                                            controller: _numeroEndCtrl,
                                            focusNode: _focoNumeroEndereco,
                                            textInputAction:
                                                TextInputAction.done,
                                            keyboardType: TextInputType.number,
                                            decoration: _obterEstiloInput(
                                              'Nº',
                                              'S/N',
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 30),

                  // BOTÃO DE ENVIO
                  FadeInUp(
                    child: SizedBox(
                      width: double.infinity,
                      height: 60,
                      child: Builder(
                        builder: (context) {
                          Color corBotao;
                          if (_contatoPreenchido && _enderecoPreenchido) {
                            corBotao = Paleta.botaoPrincipalCadastro;
                          } else if (_contatoPreenchido && _enderecoVazio) {
                            corBotao = Paleta.botaoPrincipalCadastro.withValues(
                              alpha: 0.5,
                            );
                          } else {
                            corBotao = Colors.grey.shade400;
                          }

                          bool podeEnviar =
                              _contatoPreenchido &&
                              (_enderecoPreenchido || _enderecoVazio) &&
                              !_enviandoDados;

                          return AnimatedContainer(
                            duration: const Duration(milliseconds: 400),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                if (podeEnviar)
                                  BoxShadow(
                                    color: Paleta.botaoPrincipalCadastro
                                        .withValues(alpha: 0.5),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                              ],
                            ),
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: corBotao,
                                disabledBackgroundColor: Colors.grey.shade300,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                elevation: 0,
                              ),
                              onPressed: !podeEnviar
                                  ? null
                                  : () {
                                      bool contatoValido = _formContato
                                          .currentState!
                                          .validate();
                                      bool enderecoValido =
                                          _enderecoVazio ||
                                          _formEndereco.currentState!
                                              .validate();

                                      int? idade = int.tryParse(
                                        _idadeCtrl.text,
                                      );
                                      bool erroIdade = false;
                                      if (idade != null) {
                                        if (widget.nivelSelecionado.contains(
                                              'Fundamental',
                                            ) &&
                                            idade < 15) {
                                          erroIdade = true;
                                        }
                                        if (widget.nivelSelecionado.contains(
                                              'Médio',
                                            ) &&
                                            idade < 18) {
                                          erroIdade = true;
                                        }
                                      }

                                      if (contatoValido &&
                                          enderecoValido &&
                                          !erroIdade) {
                                        _enviarInscricao();
                                      } else {
                                        setState(() {
                                          if (!contatoValido) {
                                            _contatoAberto = true;
                                            _enderecoAberto = false;
                                          } else if (!enderecoValido) {
                                            _enderecoAberto = true;
                                            _contatoAberto = false;
                                          }
                                        });

                                        if (erroIdade) {
                                          _mostrarErro(
                                            'Você não tem a idade mínima necessária para a EJA, procure a Secretaria de Educação.',
                                          );
                                        } else {
                                          _mostrarErro(
                                            'Por favor, corrija os campos marcados em vermelho.',
                                          );
                                        }
                                      }
                                    },
                              child: _enviandoDados
                                  ? const SizedBox(
                                      height: 24,
                                      width: 24,
                                      child: CircularProgressIndicator(
                                        color: Colors.white,
                                        strokeWidth: 3,
                                      ),
                                    )
                                  : const Text(
                                      'Realizar Pré-Inscrição',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 18,
                                      ),
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
          ),
        ),
      ),
    );
  }
}

class MascaraWhatsApp extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    String p = newValue.text.replaceAll(RegExp(r'\D'), '');
    if (p.length > 9) p = p.substring(0, 9);
    String t = p;
    if (p.length > 5) t = '${p.substring(0, 5)}-${p.substring(5)}';
    return TextEditingValue(
      text: t,
      selection: TextSelection.collapsed(offset: t.length),
    );
  }
}

class MascaraCPF extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    String p = newValue.text.replaceAll(RegExp(r'\D'), '');
    if (p.length > 11) p = p.substring(0, 11);
    String t = p;
    if (p.length > 9) {
      t = '${p.substring(0, 3)}.${p.substring(3, 6)}.${p.substring(6, 9)}-${p.substring(9)}';
    } else if (p.length > 6)
      t = '${p.substring(0, 3)}.${p.substring(3, 6)}.${p.substring(6)}';
    else if (p.length > 3)
      t = '${p.substring(0, 3)}.${p.substring(3)}';
    return TextEditingValue(
      text: t,
      selection: TextSelection.collapsed(offset: t.length),
    );
  }
}

class MascaraCEP extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    String p = newValue.text.replaceAll(RegExp(r'\D'), '');
    if (p.length > 8) p = p.substring(0, 8);
    String t = p;
    if (p.length > 5) t = '${p.substring(0, 5)}-${p.substring(5)}';
    return TextEditingValue(
      text: t,
      selection: TextSelection.collapsed(offset: t.length),
    );
  }
}

class DestaqueTutorial extends StatelessWidget {
  final FocusNode focusNode;
  final Widget child;

  const DestaqueTutorial({
    super.key,
    required this.focusNode,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: focusNode,
      builder: (context, childWidget) {
        final bool focado = focusNode.hasFocus;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(15),
            boxShadow: focado
                ? [
                    BoxShadow(
                      color: const Color(0xFF6366F1).withValues(alpha: 0.6),
                      blurRadius: 20,
                      spreadRadius: 5,
                    ),
                  ]
                : [],
          ),
          child: childWidget,
        );
      },
      child: child,
    );
  }
}
