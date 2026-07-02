import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import 'package:supabase_flutter/supabase_flutter.dart'; // IMPORT DO SUPABASE
import 'dart:math'; 
import 'tela_detalhes.dart';
import '../leitor_texto.dart';

class Escola {
  final String id; // NOVO: ID vindo do Supabase
  final String nome;
  final String turno;
  final LatLng posicao;
  final List<String> niveisOferecidos; 
  final String descricao;
  final String auxilios;
  double distanciaMetros;

  Escola({
    required this.id,
    required this.nome, 
    required this.turno, 
    required this.posicao, 
    required this.niveisOferecidos, 
    required this.descricao,
    required this.auxilios,
    this.distanciaMetros = 0,
  });
}

class TelaHome extends StatefulWidget {
  final String nivelEscolhido; 
  final Position? posicaoInjetada; 

  const TelaHome({
    super.key, 
    required this.nivelEscolhido,
    this.posicaoInjetada,
  });

  @override
  State<TelaHome> createState() => _TelaHomeState();
}

class _TelaHomeState extends State<TelaHome> {
  GoogleMapController? _mapController;
  Position? _minhaLocalizacao;
  Escola? _escolaSelecionadaCard;
  final Set<Marker> _marcadores = {};
  List<Escola> escolasFiltradas = [];
  bool _carregandoEscolas = true; // NOVO: Controle de carregamento do banco
  
  static const CameraPosition _posicaoInicial = CameraPosition(
    target: LatLng(
      -26.9922, 
      -48.6340,
    ), 
    zoom: 13.0,
  );

  @override
  void initState() {
    super.initState();
    _carregarEscolasDoBanco();
  }

  // NOVO: Função que busca as escolas direto do Supabase
  Future<void> _carregarEscolasDoBanco() async {
    try {
      final resposta = await Supabase.instance.client.from('escolas').select();
      
      List<Escola> todasEscolas = [];
      
      for (var linha in resposta) {
        todasEscolas.add(
          Escola(
            id: linha['id'],
            nome: linha['nome'],
            turno: linha['turno'],
            posicao: LatLng(linha['latitude'], linha['longitude']),
            niveisOferecidos: List<String>.from(linha['niveis_oferecidos']),
            descricao: linha['descricao'],
            auxilios: linha['auxilios'],
          ),
        );
      }

      if (mounted) {
        setState(() {
          escolasFiltradas = todasEscolas
              .where((e) => e.niveisOferecidos.contains(widget.nivelEscolhido))
              .toList();
          _carregandoEscolas = false;
        });

        if (widget.posicaoInjetada != null) {
          _minhaLocalizacao = widget.posicaoInjetada;
          _calcularDistanciasEGerarMarcadores();
        } else {
          _iniciarMapa();
        }
      }
    } catch (e) {
      debugPrint('Erro ao buscar escolas do Supabase: $e');
      if (mounted) {
        setState(() {
          _carregandoEscolas = false;
        });
      }
    }
  }

  @override
  void dispose() {
    pararVoz(); 
    super.dispose();
  }

  Future<void> _iniciarMapa() async {
    await _buscarMinhaLocalizacao();
    _gerarMarcadores();
  }

  Future<void> _buscarMinhaLocalizacao() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return;
    }
    
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return;
      }
    }
    
    Position posicaoAtual = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );
    
    if (mounted) {
      setState(() {
        _minhaLocalizacao = posicaoAtual;
      });
      _calcularDistanciasEGerarMarcadores();
    }
  }

  void _calcularDistanciasEGerarMarcadores() {
    if (_minhaLocalizacao == null) return;

    if (mounted) {
      setState(() {
        for (var school in escolasFiltradas) {
          school.distanciaMetros = Geolocator.distanceBetween(
            _minhaLocalizacao!.latitude, 
            _minhaLocalizacao!.longitude, 
            school.posicao.latitude, 
            school.posicao.longitude,
          );
        }
        
        escolasFiltradas.sort(
          (a, b) => a.distanciaMetros.compareTo(
            b.distanciaMetros,
          ),
        );
      });
      _gerarMarcadores();
    }
    
    if (escolasFiltradas.isNotEmpty && _mapController != null) {
      Escola escolaMaisProxima = escolasFiltradas.first;
      
      double minLat = min(
        _minhaLocalizacao!.latitude, 
        escolaMaisProxima.posicao.latitude,
      );
      double maxLat = max(
        _minhaLocalizacao!.latitude, 
        escolaMaisProxima.posicao.latitude,
      );
      double minLng = min(
        _minhaLocalizacao!.longitude, 
        escolaMaisProxima.posicao.longitude,
      );
      double maxLng = max(
        _minhaLocalizacao!.longitude, 
        escolaMaisProxima.posicao.longitude,
      );
      
      _mapController?.animateCamera(
        CameraUpdate.newLatLngBounds(
          LatLngBounds(
            southwest: LatLng(
              minLat, 
              minLng,
            ), 
            northeast: LatLng(
              maxLat, 
              maxLng,
            ),
          ), 
          60.0,
        ),
      );
    }
  }

  void _gerarMarcadores() {
    _marcadores.clear();
    for (var school in escolasFiltradas) {
      _marcadores.add(
        Marker(
          markerId: MarkerId(
            school.nome,
          ), 
          position: school.posicao, 
          icon: BitmapDescriptor.defaultMarkerWithHue(
            BitmapDescriptor.hueOrange, 
          ), 
          onTap: () {
            setState(() {
              _escolaSelecionadaCard = school;
            });
            _focarNaEscola(
              school.posicao,
            );
          },
        ),
      );
    }
    if (mounted) {
      setState(() {});
    }
  }

  void _focarNaEscola(LatLng local) {
    _mapController?.animateCamera(
      CameraUpdate.newCameraPosition(
        CameraPosition(
          target: local, 
          zoom: 16.5,
        ),
      ),
    );
  }
  
  String _formatarDistancia(double metros) {
    if (metros < 1000) {
      return '${metros.toInt()} m';
    } else {
      return '${(metros / 1000).toStringAsFixed(1)} km';
    }
  }

  @override
  Widget build(BuildContext context) {
    final escolaAtiva = _escolaSelecionadaCard;
    
    String leituraEscolas = escolasFiltradas.isEmpty 
        ? 'Nenhuma escola encontrada.' 
        : 'Escolas Disponíveis no mapa: ${escolasFiltradas.map((e) => "${e.nome}, turno ${e.turno}").join('. ')}';

    return Scaffold(
      backgroundColor: const Color(
        0xFFFAFAFA, 
      ),
      appBar: AppBar(
        title: TextoAcessivel(
          texto: 'Vagas para ${widget.nivelEscolhido}', 
          estilo: GoogleFonts.inter( 
            fontWeight: FontWeight.w900, 
            color: const Color(
              0xFF3F51B5, 
            ), 
            fontSize: 16,
          ),
        ),
        backgroundColor: const Color(
          0xFFFAFAFA,
        ), 
        elevation: 0, 
        centerTitle: true, 
        iconTheme: const IconThemeData(
          color: Color(
            0xFF3F51B5, 
          ),
        ),
        actions: [
          BotaoAcessibilidadeGlobal(
            textoLeituraTela: leituraEscolas,
          )
        ],
      ),
      body: Stack(
        children: [
          Positioned.fill(
            child: GoogleMap(
              initialCameraPosition: _posicaoInicial, 
              markers: _marcadores, 
              myLocationEnabled: true, 
              myLocationButtonEnabled: true, 
              zoomControlsEnabled: true, 
              padding: const EdgeInsets.only(
                bottom: 240, 
                top: 100,
              ), 
              onMapCreated: (controller) {
                _mapController = controller;
                if (_minhaLocalizacao != null && escolasFiltradas.isNotEmpty) {
                  _calcularDistanciasEGerarMarcadores();
                }
              }, 
              onTap: (_) {
                setState(() {
                  _escolaSelecionadaCard = null;
                });
              },
            ),
          ),
          
          // NOVO: Exibe a bolinha de carregamento enquanto busca do Supabase
          if (_carregandoEscolas)
            Positioned.fill(
              child: Container(
                color: Colors.white.withOpacity(0.8),
                child: const Center(
                  child: CircularProgressIndicator(
                    color: Color(0xFF3F51B5),
                  ),
                ),
              ),
            ),
          
          if (escolaAtiva != null)
            Positioned(
              top: 20, 
              left: 20, 
              right: 20,
              child: FadeInDown(
                duration: const Duration(
                  milliseconds: 400,
                ),
                child: GestureDetector(
                  onTap: () {}, 
                  child: Container(
                    padding: const EdgeInsets.all(
                      16,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white, 
                      borderRadius: BorderRadius.circular(
                        20,
                      ), 
                      boxShadow: const [
                        BoxShadow(
                          color: Colors.black26, 
                          blurRadius: 15, 
                          offset: Offset(
                            0, 
                            5,
                          ),
                        )
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 60, 
                          height: 60, 
                          decoration: BoxDecoration(
                            color: const Color(
                              0xFFE8EAF6, 
                            ), 
                            borderRadius: BorderRadius.circular(
                              15,
                            ),
                          ), 
                          child: const Icon(
                            Icons.school_rounded, 
                            color: Color(
                              0xFF3F51B5, 
                            ), 
                            size: 30,
                          ),
                        ),
                        const SizedBox(
                          width: 16,
                        ),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              TextoAcessivel(
                                texto: escolaAtiva.nome, 
                                textoOcultoParaLer: '${escolaAtiva.nome}. Clique em Ver Detalhes abaixo.', 
                                estilo: GoogleFonts.inter( 
                                  fontWeight: FontWeight.w900, 
                                  fontSize: 16, 
                                  color: const Color(
                                    0xFF3F51B5, 
                                  ),
                                ),
                              ),
                              const SizedBox(
                                height: 8,
                              ),
                              SizedBox(
                                width: double.infinity, 
                                height: 36, 
                                child: ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(
                                      0xFFFF9800, 
                                    ), 
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(
                                        10,
                                      ),
                                    ), 
                                    padding: EdgeInsets.zero,
                                  ), 
                                  onPressed: () {
                                    pararVoz(); 
                                    Navigator.push(
                                      context, 
                                      MaterialPageRoute(
                                        builder: (context) => TelaDetalhes(
                                          idEscola: escolaAtiva.id, // NOVO: Passando o ID pro Detalhes
                                          nomeEscola: escolaAtiva.nome, 
                                          nivel: widget.nivelEscolhido, 
                                          turno: escolaAtiva.turno, 
                                          horario: escolaAtiva.turno.contains('19h') ? '19h às 22h' : 'A combinar', 
                                          descricao: escolaAtiva.descricao, 
                                          auxilios: escolaAtiva.auxilios, 
                                          distancia: _formatarDistancia(
                                            escolaAtiva.distanciaMetros,
                                          ),
                                        ),
                                      ),
                                    );
                                  }, 
                                  child: const TextoAcessivel(
                                    texto: 'Ver Detalhes', 
                                    corIcone: Colors.white, 
                                    estilo: TextStyle(
                                      fontWeight: FontWeight.bold, 
                                      fontSize: 14, 
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(
                            Icons.close, 
                            color: Colors.grey,
                          ), 
                          onPressed: () {
                            setState(() {
                              _escolaSelecionadaCard = null;
                            });
                          },
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            
          Positioned(
            bottom: 0, 
            left: 0, 
            right: 0,
            child: SafeArea(
              bottom: true,
              child: FadeInUp(
                duration: const Duration(
                  milliseconds: 800,
                ),
                child: Container(
                  height: 230,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter, 
                      end: Alignment.topCenter, 
                      colors: [
                        Color(
                          0xFFFAFAFA, 
                        ), 
                        Color(
                          0xFFFAFAFA,
                        ),
                        Colors.white70, 
                        Colors.transparent,
                      ],
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start, 
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(
                          left: 20, 
                          bottom: 12,
                        ), 
                        child: TextoAcessivel(
                          texto: escolasFiltradas.isEmpty ? 'Nenhuma escola encontrada' : 'Escolas Disponíveis', 
                          estilo: GoogleFonts.inter( 
                            fontSize: 20, 
                            fontWeight: FontWeight.w900, 
                            color: const Color(
                              0xFF3F51B5, 
                            ),
                          ),
                        ),
                      ),
                      SizedBox(
                        height: 140, 
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal, 
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                          ), 
                          itemCount: escolasFiltradas.length, 
                          itemBuilder: (context, index) {
                            final school = escolasFiltradas[index];
                            final bool ehAMaisProxima = index == 0 && _minhaLocalizacao != null;
                            final bool estaSelecionada = _escolaSelecionadaCard == school;
                            
                            return Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8.0, 
                                vertical: 4.0,
                              ),
                              child: InkWell(
                                onTap: () {
  _focarNaEscola(school.posicao); 
  
  // O truque para o Web: atraso de 100 milissegundos para o clique não "vazar" pro mapa
  Future.delayed(const Duration(milliseconds: 100), () {
    if (mounted) {
      setState(() {
        _escolaSelecionadaCard = school;
      });
    }
  });
},
                                child: Container(
                                  width: 280, 
                                  padding: const EdgeInsets.all(
                                    12,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.white, 
                                    borderRadius: BorderRadius.circular(
                                      20,
                                    ), 
                                    border: Border.all(
                                      color: estaSelecionada 
                                          ? const Color(
                                              0xFFFF9800, 
                                            ) 
                                          : Colors.transparent, 
                                      width: 2.5,
                                    ), 
                                    boxShadow: const [
                                      BoxShadow(
                                        color: Colors.black12, 
                                        blurRadius: 6, 
                                        offset: Offset(
                                          0, 
                                          3,
                                        ),
                                      ),
                                    ],
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 60, 
                                        height: 80, 
                                        decoration: BoxDecoration(
                                          color: const Color(
                                            0xFFE8EAF6, 
                                          ), 
                                          borderRadius: BorderRadius.circular(
                                            12,
                                          ),
                                        ), 
                                        child: const Icon(
                                          Icons.school_rounded, 
                                          color: Color(
                                            0xFF3F51B5, 
                                          ),
                                        ),
                                      ),
                                      const SizedBox(
                                        width: 12,
                                      ),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start, 
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            if (ehAMaisProxima) 
                                              Container(
                                                padding: const EdgeInsets.symmetric(
                                                  horizontal: 6, 
                                                  vertical: 2,
                                                ), 
                                                margin: const EdgeInsets.only(
                                                  bottom: 4,
                                                ), 
                                                decoration: BoxDecoration(
                                                  color: const Color(
                                                    0xFFFF9800, 
                                                  ), 
                                                  borderRadius: BorderRadius.circular(
                                                    6,
                                                  ),
                                                ), 
                                                child: const Text(
                                                  'MAIS PRÓXIMO', 
                                                  style: TextStyle(
                                                    color: Colors.white, 
                                                    fontSize: 10, 
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                              
                                            TextoAcessivel(
                                              texto: school.nome, 
                                              estilo: GoogleFonts.inter(
                                                fontWeight: FontWeight.w900, 
                                                fontSize: 14, 
                                                color: const Color(
                                                  0xFF3F51B5, 
                                                ),
                                                letterSpacing: -0.5,
                                              ),
                                            ),
                                            const SizedBox(
                                              height: 4,
                                            ),
                                            Row(
                                              children: [
                                                const Icon(
                                                  Icons.schedule_rounded, 
                                                  size: 12, 
                                                  color: Color(
                                                    0xFF757575, 
                                                  ),
                                                ), 
                                                const SizedBox(
                                                  width: 4,
                                                ), 
                                                Text(
                                                  school.turno, 
                                                  style: const TextStyle(
                                                    fontSize: 12, 
                                                    color: Color(
                                                      0xFF757575,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(
                                              height: 8,
                                            ),
                                            TextoAcessivel(
                                              texto: _minhaLocalizacao != null 
                                                  ? _formatarDistancia(
                                                      school.distanciaMetros,
                                                    ) 
                                                  : 'Calculando...', 
                                              estilo: const TextStyle(
                                                fontSize: 14, 
                                                fontWeight: FontWeight.bold, 
                                                color: Color(
                                                  0xFFFF9800, 
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
                            );
                          },
                        ),
                      ),
                      const SizedBox(
                        height: 10,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}