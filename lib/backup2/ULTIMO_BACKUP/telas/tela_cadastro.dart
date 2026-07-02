import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import 'package:flutter/services.dart'; 
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart'; 
import 'tela_sucesso.dart';
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

  final FocusNode _focoDdd = FocusNode();
  final FocusNode _focoNumero = FocusNode();
  final FocusNode _focoNumeroEndereco = FocusNode();

  bool _buscando = false;
  bool _camposEndTravados = false;
  String _cidadeSelecionada = 'Camboriú'; 
  
  bool _contatoAberto = true;
  bool _enderecoAberto = false;
  
  bool _enviandoDados = false; 

  final List<String> _cidadesPermitidas = [
    'Camboriú', 
    'Balneário Camboriú',
  ];


// ==========================================================
  // CHECAGEM DE UX: Verifica se o básico foi preenchido 
  // para remover o "!" e ativar o Botão Principal
  // ==========================================================
  bool get _contatoPreenchido {
    return _nomeCtrl.text.isNotEmpty &&
           _cpfCtrl.text.length == 14 &&
           _dddCtrl.text.length == 2 &&
           _numeroCtrl.text.length >= 10;
  }

  bool get _enderecoPreenchido {
    return _cepCtrl.text.length == 9 &&
           _ruaCtrl.text.isNotEmpty &&
           _bairroCtrl.text.isNotEmpty &&
           _cidadeSelecionada.isNotEmpty;
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
    return _cidadesPermitidas.any((element) => element.toLowerCase() == cidade.toLowerCase());
  }

  Future<void> _buscarPorCep(String cep) async {
    String cleanCep = cep.replaceAll(RegExp(r'\D'), '');
    if (cleanCep.length != 8) return;

    setState(() { _buscando = true; });
    
    try {
      final resposta = await http.get(Uri.parse('https://viacep.com.br/ws/$cleanCep/json/'));
      
      if (resposta.statusCode == 200) {
        final dados = json.decode(resposta.body);
        
        if (dados['erro'] == null) {
          String cidadeRetornada = dados['localidade'];
          
          if (_validarCidadePermitida(cidadeRetornada)) {
            setState(() {
              _ruaCtrl.text = dados['logradouro'] ?? '';
              _bairroCtrl.text = dados['bairro'] ?? '';
              _cidadeSelecionada = _cidadesPermitidas.firstWhere((c) => c.toLowerCase() == cidadeRetornada.toLowerCase());
              _camposEndTravados = true;
              FocusScope.of(context).requestFocus(_focoNumeroEndereco);
            });
          } else {
            _mostrarErro('Inscrições limitadas a Camboriú e Balneário Camboriú.');
            _resetarEndereco();
          }
        }
      }
    } catch (e) {
      debugPrint('Erro CEP: $e');
    } finally {
      setState(() { _buscando = false; });
    }
  }

  Future<Iterable<Map<String, String>>> _sugerirRuasGlobal(String termo) async {
    if (termo.length < 3 || _camposEndTravados) return const Iterable.empty();

    setState(() { _buscando = true; });
    List<Map<String, String>> resultados = [];

    try {
      for (String cidade in _cidadesPermitidas) {
        String cidadeUrl = cidade.replaceAll(' ', '%20');
        final resposta = await http.get(Uri.parse('https://viacep.com.br/ws/SC/$cidadeUrl/$termo/json/'));
        
        if (resposta.statusCode == 200) {
          final List dados = json.decode(resposta.body);
          
          for (var item in dados) {
            String cidadeRealViaCep = item['localidade'] ?? '';
            
            if (_validarCidadePermitida(cidadeRealViaCep)) {
              String cidadeFormatada = _cidadesPermitidas.firstWhere((c) => c.toLowerCase() == cidadeRealViaCep.toLowerCase());
              bool jaAdicionado = resultados.any((r) => r['cep'] == item['cep']);

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
      setState(() { _buscando = false; });
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

  void _mostrarErro(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red.shade700));
  }

  Future<void> _enviarInscricao() async {
    setState(() { _enviandoDados = true; });

    try {
      await Supabase.instance.client.from('inscricoes').insert({
        'escola_id': widget.idEscolaSelecionada,
        'nivel_selecionado': widget.nivelSelecionado,
        'turno_selecionado': widget.turnoSelecionado, 
        'nome_completo': _nomeCtrl.text,
        'cpf': _cpfCtrl.text.replaceAll(RegExp(r'\D'), ''), 
        'ddd': _dddCtrl.text,
        'telefone': _numeroCtrl.text.replaceAll(RegExp(r'\D'), ''),
        'email_aluno': _emailCtrl.text.isEmpty ? null : _emailCtrl.text,
        'cidade': _cidadeSelecionada,
        'cep': _cepCtrl.text.replaceAll(RegExp(r'\D'), ''),
        'rua': _ruaCtrl.text,
        'bairro': _bairroCtrl.text,
        'numero_endereco': _numeroEndCtrl.text.isEmpty ? null : _numeroEndCtrl.text,
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
      
      // MÁGICA 3: MENSAGEM DE ERRO ATUALIZADA
      if (e.toString().contains('cpf_escola_turno_unico') || e.toString().contains('unique constraint')) {
        msgErro = 'Você já realizou uma pré-inscrição nesta escola para este turno!';
      }
      
      _mostrarErro(msgErro);
    } finally {
      if (mounted) {
        setState(() { _enviandoDados = false; });
      }
    }
  }@override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F7FF), 
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        // ... seu leading com o botão de voltar ...
        actions: [
          // ==========================================
          // BOTÃO DEBUG: PULAR CADASTRO (APAGAR DEPOIS)
          // ==========================================
          TextButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const TelaSucesso(),
                ),
              );
            },
            child: const Text(
              'PULAR',
              style: TextStyle(
                color: Colors.white, // Ou a cor que combinar com o seu cabeçalho
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: ListView(
            physics: const ClampingScrollPhysics(),
            children: [
              FadeInDown(
                child: Column(
                  children: [
                    TextoAcessivel(
                      texto: 'Você está se inscrevendo na escola',
                      alinhamento: TextAlign.center,
                      estilo: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF6366F1)),
                    ),
                    const SizedBox(height: 4),
                    TextoAcessivel(
                      texto: widget.nomeEscolaSelecionada,
                      alinhamento: TextAlign.center,
                      estilo: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w900, color: const Color(0xFF1E1B4B)),
                    ),
                    const SizedBox(height: 12),
                    
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(color: const Color(0xFFEDE9FE), borderRadius: BorderRadius.circular(10)),
                          child: Text('Nível: ${widget.nivelSelecionado}', style: const TextStyle(color: Color(0xFF3730A3), fontSize: 13, fontWeight: FontWeight.bold)),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(color: const Color(0xFFE0E7FF), borderRadius: BorderRadius.circular(10)),
                          child: Text('Turno: ${widget.turnoSelecionado}', style: const TextStyle(color: Color(0xFF3730A3), fontSize: 13, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),

              Container(
                decoration: BoxDecoration(
                  color: Colors.white, borderRadius: BorderRadius.circular(20), 
                  boxShadow: [BoxShadow(color: const Color(0xFF4F46E5).withOpacity(0.05), blurRadius: 15)],
                ),
                child: Column(
                  children: [
                    InkWell(
                      onTap: () { 
                        setState(() { 
                          if (_contatoAberto) {
                            _contatoAberto = false; // Se já estava aberta, apenas fecha
                          } else {
                            _contatoAberto = true;  // Abre esta
                            _enderecoAberto = false; // Garante que o Endereço fecha
                          }
                        }); 
                      },
                      borderRadius: BorderRadius.circular(20),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Row(
                          children: [
                            const Icon(Icons.person_outline_rounded, color: Color(0xFF4F46E5)),
                            const SizedBox(width: 10),
                            Text('DADOS DE CONTATO', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: const Color(0xFF1E1B4B))),
                            const Spacer(),

                            if (!_contatoAberto && !_contatoPreenchido)
                              const Padding(
                                padding: EdgeInsets.only(right: 12.0),
                                child: Icon(Icons.error_outline_rounded, color: Colors.orange, size: 20),
                              ),

                            Icon(_contatoAberto ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded, color: Colors.grey),
                          ],
                        ),
                      ),
                    ),
                    Offstage(
                      offstage: !_contatoAberto,
                      child: Form(
                        key: _formContato,
                        onChanged: () => setState(() {}),
                        child: Padding(
                          padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 10),
                              TextFormField(
                                controller: _nomeCtrl,
                                decoration: InputDecoration(labelText: 'Nome Completo', hintText: 'Digite seu nome', isDense: true, filled: true, fillColor: Colors.white, border: OutlineInputBorder(borderRadius: BorderRadius.circular(15))),
                                validator: (v) => v == null || v.isEmpty ? 'Nome é obrigatório' : null,
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _cpfCtrl,
                                keyboardType: TextInputType.number,
                                inputFormatters: [MascaraCPF()],
                                decoration: InputDecoration(labelText: 'CPF (Obrigatório)', hintText: '000.000.000-00', isDense: true, filled: true, fillColor: Colors.white, border: OutlineInputBorder(borderRadius: BorderRadius.circular(15))),
                                validator: (v) {
                                  if (v == null || v.isEmpty) return 'Digite o CPF';
                                  if (!_isCpfValido(v)) return 'CPF Inválido';
                                  return null;
                                },
                              ),
                              const SizedBox(height: 12),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    margin: const EdgeInsets.only(top: 2), padding: const EdgeInsets.all(10),
                                    decoration: const BoxDecoration(color: Color(0xFFEDE9FE), shape: BoxShape.circle),
                                    child: const Icon(Icons.chat_bubble_rounded, color: Color(0xFF4F46E5), size: 24),
                                  ),
                                  const SizedBox(width: 8),
                                  SizedBox(
                                    width: 75, 
                                    child: TextFormField(
                                      controller: _dddCtrl, focusNode: _focoDdd, keyboardType: TextInputType.number, maxLength: 2, textAlign: TextAlign.center,
                                      decoration: InputDecoration(labelText: 'DDD', hintText: '00', counterText: '', isDense: true, filled: true, fillColor: Colors.white, border: OutlineInputBorder(borderRadius: BorderRadius.circular(15))),
                                      onChanged: (v) { if (v.length == 2) FocusScope.of(context).requestFocus(_focoNumero); },
                                      validator: (v) => v == null || v.length < 2 ? 'Erro' : null,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: TextFormField(
                                      controller: _numeroCtrl, focusNode: _focoNumero, keyboardType: TextInputType.number, inputFormatters: [MascaraWhatsApp()],
                                      decoration: InputDecoration(labelText: 'Telefone (WhatsApp)', hintText: '00000-0000', isDense: true, filled: true, fillColor: Colors.white, border: OutlineInputBorder(borderRadius: BorderRadius.circular(15))),
                                      validator: (v) => v == null || v.length < 10 ? 'Telefone incompleto' : null,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              TextFormField(
                                controller: _emailCtrl,
                                keyboardType: TextInputType.emailAddress,
                                decoration: InputDecoration(labelText: 'E-mail (Opcional)', hintText: 'exemplo@email.com', isDense: true, filled: true, fillColor: Colors.white, border: OutlineInputBorder(borderRadius: BorderRadius.circular(15))),
                                validator: (v) {
                                  if (v != null && v.isNotEmpty && !v.contains('@')) return 'E-mail inválido';
                                  return null;
                                },
                              ),
                              const SizedBox(height: 15),
                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton.icon(
                                  onPressed: () {
                                    if (_formContato.currentState!.validate()) {
                                      FocusScope.of(context).unfocus();
                                      setState(() { _contatoAberto = false; _enderecoAberto = true; });
                                    } else {
                                      _mostrarErro('Verifique os campos em vermelho antes de avançar.');
                                    }
                                  },
                                  icon: const Icon(Icons.arrow_downward_rounded, size: 18, color: Color(0xFF4F46E5)),
                                  label: const Text('Continuar para Endereço', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF4F46E5))),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 15),

              Container(
                decoration: BoxDecoration(
                  color: Colors.white, borderRadius: BorderRadius.circular(20), 
                  boxShadow: [BoxShadow(color: const Color(0xFF4F46E5).withOpacity(0.05), blurRadius: 15)],
                ),
                child: Column(
                  children: [
                    InkWell(
onTap: () { 
                        setState(() { 
                          if (_enderecoAberto) {
                            _enderecoAberto = false; // Se já estava aberta, apenas fecha
                          } else {
                            _enderecoAberto = true;  // Abre esta
                            _contatoAberto = false;  // Garante que o Contato fecha
                          }
                        }); 
                      },                      borderRadius: BorderRadius.circular(20),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Row(
                          children: [
                            const Icon(Icons.location_on_outlined, color: Color(0xFF4F46E5)),
                            const SizedBox(width: 10),
                            Text('ENDEREÇO', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: const Color(0xFF1E1B4B))),
                            const Spacer(),

                            // MUDANÇA UX: Ícone de alerta caso a aba esteja fechada e o formulário incompleto
                            if (!_enderecoAberto && !_enderecoPreenchido)
                              const Padding(
                                padding: EdgeInsets.only(right: 12.0),
                                child: Icon(Icons.error_outline_rounded, color: Colors.orange, size: 20),
                              ),

                            Icon(_enderecoAberto ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded, color: Colors.grey),
                          ],
                        ),
                      ),
                    ),
                    Offstage(
                      offstage: !_enderecoAberto,
                      child: Form(
                        key: _formEndereco,
                        child: Padding(
                          padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 10),
                              DropdownButtonFormField<String>(
                                initialValue: _cidadeSelecionada,
                                decoration: InputDecoration(labelText: 'Cidade', isDense: true, filled: true, fillColor: Colors.white, border: OutlineInputBorder(borderRadius: BorderRadius.circular(15))),
                                items: _cidadesPermitidas.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                                onChanged: (v) { setState(() { _cidadeSelecionada = v!; }); },
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: TextFormField(
                                      controller: _cepCtrl, keyboardType: TextInputType.number, inputFormatters: [MascaraCEP()],
                                      decoration: InputDecoration(
                                        labelText: 'Buscar CEP', hintText: '00000-000', isDense: true, filled: true, fillColor: Colors.white, border: OutlineInputBorder(borderRadius: BorderRadius.circular(15)),
                                        suffixIcon: _buscando ? const Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF4F46E5)))) : null,
                                      ),
                                      onChanged: (v) {
                                          setState(() {});
                                         if (v.length == 9) _buscarPorCep(v);
                                          },
                                      validator: (v) => v == null || v.isEmpty ? 'CEP obrigatório' : null,
                                    ),
                                  ),
                                  if (_camposEndTravados)
                                    Padding(
                                      padding: const EdgeInsets.only(left: 8),
                                     child: IconButton(
                                        onPressed: _resetarEndereco, 
                                        icon: const Icon(Icons.edit_rounded, color: Color(0xFF4F46E5)), 
                                        tooltip: 'Editar Endereço'
                                      ),
                                    )
                                ],
                              ),
                              const SizedBox(height: 12),
                              RawAutocomplete<Map<String, String>>(
                                optionsBuilder: (TextEditingValue textEditingValue) { return _sugerirRuasGlobal(textEditingValue.text); },
                                displayStringForOption: (option) => option['rua']!,
                                onSelected: (Map<String, String> selection) {
                                  setState(() {
                                    _ruaCtrl.text = selection['rua']!; _bairroCtrl.text = selection['bairro']!;
                                    _cepCtrl.text = selection['cep']!; _cidadeSelecionada = selection['cidade']!;
                                    _camposEndTravados = true; FocusScope.of(context).requestFocus(_focoNumeroEndereco);
                                  });
                                },
                                fieldViewBuilder: (context, controller, focusNode, onFieldSubmitted) {
                                  if (controller.text.isEmpty && _ruaCtrl.text.isNotEmpty) controller.text = _ruaCtrl.text;
                                  return TextFormField(
                                    controller: controller, focusNode: focusNode, 
                                    readOnly: _camposEndTravados || _buscando,
                                    decoration: InputDecoration(
                                      labelText: 'Buscar Rua', 
                                      // MUDANÇA UX: Feedback visual no texto enquanto busca
                                      hintText: _buscando ? 'Localizando endereço...' : 'Digite o nome da rua...', 
                                      isDense: true, 
                                      filled: true, 
                                      fillColor: _camposEndTravados || _buscando ? Colors.grey.shade100 : Colors.white, 
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(15)), 
                                      suffixIcon: const Icon(Icons.search_rounded, size: 20)
                                    ),
                                    validator: (v) => v == null || v.isEmpty ? 'Rua obrigatória' : null,
                                  );
                                },
                                optionsViewBuilder: (context, onSelected, options) {
                                  return Align(
                                    alignment: Alignment.topLeft,
                                    child: Material(
                                      elevation: 4.0, borderRadius: BorderRadius.circular(15),
                                      child: Container(
                                        width: MediaQuery.of(context).size.width - 72, constraints: const BoxConstraints(maxHeight: 250),
                                        child: ListView.builder(
                                          padding: EdgeInsets.zero, shrinkWrap: true, itemCount: options.length,
                                          itemBuilder: (context, index) {
                                            final option = options.elementAt(index);
                                            return ListTile(
                                              title: Text(option['rua']!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                              subtitle: Text("${option['bairro']} - ${option['cidade']}", style: const TextStyle(fontSize: 12)),
                                              onTap: () { onSelected(option); },
                                            );
                                          },
                                        ),
                                      ),
                                    ),
                                  );
                                },
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    flex: 2,
                                    child: TextFormField(
                                      controller: _bairroCtrl, readOnly: _camposEndTravados,
                                      decoration: InputDecoration(labelText: 'Bairro', isDense: true, filled: true, fillColor: _camposEndTravados ? Colors.grey.shade100 : Colors.white, border: OutlineInputBorder(borderRadius: BorderRadius.circular(15))), 
                                      validator: (v) => v == null || v.isEmpty ? 'Bairro obrigatório' : null,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    flex: 1,
                                    child: TextFormField(
                                      controller: _numeroEndCtrl, focusNode: _focoNumeroEndereco, keyboardType: TextInputType.number,
                                      // MUDANÇA UX: Troca de Opcional para S/N para caber bonitinho
                                      decoration: InputDecoration(labelText: 'Nº', hintText: 'S/N', isDense: true, filled: true, fillColor: Colors.white, border: OutlineInputBorder(borderRadius: BorderRadius.circular(15))), 
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

              FadeInUp(
                child: SizedBox(
                  width: double.infinity, height: 60, 

                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 400),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        if (_contatoPreenchido && _enderecoPreenchido)
                          BoxShadow(color: const Color(0xFF7C3AED).withOpacity(0.5), blurRadius: 10, offset: const Offset(0, 4))
                      ]
                    ),

                  child: ElevatedButton(
                   style: ElevatedButton.styleFrom(
                        // MUDANÇA UX: Cinza e sem vida até preencher tudo!
                        backgroundColor: (_contatoPreenchido && _enderecoPreenchido) 
                            ? const Color(0xFF7C3AED) 
                            : Colors.grey.shade400,
                        disabledBackgroundColor: Colors.grey.shade300,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)), 
                        elevation: 0,
                    ), 
                      onPressed: (_enviandoDados || !_contatoPreenchido || !_enderecoPreenchido) ? null : () {                      bool contatoValido = _formContato.currentState!.validate();
                      bool enderecoValido = _formEndereco.currentState!.validate();

                      if (contatoValido && enderecoValido) {
                        _enviarInscricao(); 
                      } else {
                        setState(() {
                          if (!contatoValido) { _contatoAberto = true; _enderecoAberto = false; } 
                          else if (!enderecoValido) { _enderecoAberto = true; _contatoAberto = false; }
                        });
                        _mostrarErro('Por favor, corrija os campos marcados em vermelho.');
                      }
                    }, 
                    child: _enviandoDados 
                        ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3))
                        : const Text('Realizar Pré-Inscrição', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                  ),
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

class MascaraWhatsApp extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    String p = newValue.text.replaceAll(RegExp(r'\D'), '');
    if (p.length > 9) p = p.substring(0, 9);
    String t = p;
    if (p.length > 5) t = '${p.substring(0, 5)}-${p.substring(5)}';
    return TextEditingValue(text: t, selection: TextSelection.collapsed(offset: t.length));
  }
}

class MascaraCPF extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    String p = newValue.text.replaceAll(RegExp(r'\D'), '');
    if (p.length > 11) p = p.substring(0, 11);
    String t = p;
    if (p.length > 9) {
      t = '${p.substring(0, 3)}.${p.substring(3, 6)}.${p.substring(6, 9)}-${p.substring(9)}';
    } else if (p.length > 6) t = '${p.substring(0, 3)}.${p.substring(3, 6)}.${p.substring(6)}';
    else if (p.length > 3) t = '${p.substring(0, 3)}.${p.substring(3)}';
    return TextEditingValue(text: t, selection: TextSelection.collapsed(offset: t.length));
  }
}

class MascaraCEP extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    String p = newValue.text.replaceAll(RegExp(r'\D'), '');
    if (p.length > 8) p = p.substring(0, 8);
    String t = p;
    if (p.length > 5) t = '${p.substring(0, 5)}-${p.substring(5)}';
    return TextEditingValue(text: t, selection: TextSelection.collapsed(offset: t.length));
  }
}