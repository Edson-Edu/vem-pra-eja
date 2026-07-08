import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/gestures.dart';
import 'dart:ui' as ui;
import 'dart:typed_data';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import 'dart:math';
import 'tela_detalhes.dart';
import '../leitor_texto.dart';

// ============================================================================
// CLASSES DE MODELO
// ============================================================================

class TurnoEscola {
  final String id;
  final String turno;
  final String horario;
  final String descricao;
  final String auxilios;
  final String nivelDoTurno;
  final String diasAula;

  TurnoEscola({
    required this.id,
    required this.turno,
    required this.horario,
    required this.descricao,
    required this.auxilios,
    required this.nivelDoTurno,
    required this.diasAula,
  });
}

class Escola {
  final String id;
  final String nome;
  final String bairro;
  final String cidade;
  final LatLng posicao;
  final List<String> niveisOferecidos;
  final List<TurnoEscola> turnos;
  final List<String> imagens;
  double distanciaMetros;

  Escola({
    required this.id,
    required this.nome,
    required this.bairro,
    required this.cidade,
    required this.posicao,
    required this.niveisOferecidos,
    required this.turnos,
    required this.imagens,
    this.distanciaMetros = 0,
  });
}

// ============================================================================
// DELEGATE PARA O CABEÇALHO FIXO (STICKY HEADER)
// ============================================================================
class _CabecalhoFixoDelegate extends SliverPersistentHeaderDelegate {
  final int quantidadeEscolas;

  _CabecalhoFixoDelegate(this.quantidadeEscolas);

  @override
  double get minExtent => 65.0; 
  @override
  double get maxExtent => 65.0;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFFF8F7FF),
        border: Border(
          bottom: BorderSide(color: Color(0xFFEDE9FE), width: 1.5),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 4),
              width: 40,
              height: 5,
              decoration: BoxDecoration(
                color: Colors.grey.shade400,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
            child: Row(
              children: [
                const Icon(
                  Icons.location_on_rounded, 
                  color: Color(0xFF7C3AED), 
                  size: 18,
                ),
                const SizedBox(width: 8),
                TextoAcessivel(
                  texto: '$quantidadeEscolas escolas prontas para te receber',
                  estilo: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF3730A3),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _CabecalhoFixoDelegate oldDelegate) {
    return oldDelegate.quantidadeEscolas != quantidadeEscolas;
  }
}

// ============================================================================
// TELA PRINCIPAL (MAPA E BOTTOM SHEET)
// ============================================================================

class TelaHome extends StatefulWidget {
  final String nivelEscolhido;
  final Position? posicaoInjetada;
  final List<dynamic> dadosBrutosEscolas;

  const TelaHome({
    super.key,
    required this.nivelEscolhido,
    this.posicaoInjetada,
    required this.dadosBrutosEscolas,
  });

  @override
  State<TelaHome> createState() => _TelaHomeState();
}

class _TelaHomeState extends State<TelaHome> {

  // ============================================================================
  // CONTROLADORES E VARIÁVEIS DE ESTADO
  // ============================================================================
  GoogleMapController? _mapController;
  Position? _minhaLocalizacao;
  final Set<Marker> _marcadores = {};
  List<Escola> escolasFiltradas = [];
  bool _carregandoEscolas = true;
  String? _escolaDestacadaId;
  final Map<String, GlobalKey> _keysEscola = {};

  final DraggableScrollableController _sheetController = DraggableScrollableController();
  
  double _sheetSize = 0.65; 
  double _sheetInitialSize = 0.65;
  double _sheetMaxSize = 0.95;

  bool _jaExpandiu = false;
  final ScrollController _listaController = ScrollController(); 

  bool _mouseSobreLista = false;
  bool _tocandoLista = false;
  
  bool get _bloquearMapa => _mouseSobreLista || _tocandoLista;

  void _atualizarBloqueioMapa() {
    Future.microtask(() {
      if (mounted) setState(() {});
    });
  }

  static const CameraPosition _posicaoInicial = CameraPosition(
    target: LatLng(-26.9922, -48.6340),
    zoom: 13.0,
  );

  @override
  void initState() {
    super.initState();
    _montarEscolasPreCarregadas();
    _sheetController.addListener(_onSheetChanged);
  }

 void _onSheetChanged() {
    if (!_sheetController.isAttached) return;
    final size = _sheetController.size;
    
    if (size > 0.85) {
      _jaExpandiu = true;
    } else if (size < 0.70) {
      // MÁGICA DA ROLAGEM: Se a caixinha descer para o tamanho X (ex: 0.65), 
      // a lista "esquece" que expandiu. Assim, no próximo scroll pra cima, ela sobe de novo!
      _jaExpandiu = false; 
    }
    
    if ((size - _sheetSize).abs() > 0.001) {
      setState(() { _sheetSize = size; });
    }
  }


// ============================================================================
  // UX: ANIMAÇÃO DE NUDGE (O TREMOR DA GAVETA - VERSÃO INTELIGENTE)
  // ============================================================================
  void _animarNudgeInicial() async {
    // Dá o tempo de 1.5s para a tela carregar
    await Future.delayed(const Duration(milliseconds: 1500));
    
    // ========================================================================
    // O SENSOR DE DEDO (A MÁGICA AQUI):
    // Se o widget morreu, se a gaveta não tá pronta, 
    // SE O USUÁRIO ESTIVER COM O DEDO NA TELA (_tocandoLista),
    // OU se a gaveta já não estiver mais em 65% (ele já puxou): CANCELA O TREMOR!
    // ========================================================================
    if (!mounted || 
        !_sheetController.isAttached || 
        _tocandoLista || 
        (_sheetSize - 0.65).abs() > 0.02) {
      return; 
    }

    // Se ele não tocou em nada, faz a respiração subindo
    await _sheetController.animateTo(
      0.72,
      duration: const Duration(milliseconds: 600),
      curve: Curves.easeOutCubic, 
    );
    
    await Future.delayed(const Duration(milliseconds: 150));
    
    // Sensor de dedo de novo (vai que ele agarra a gaveta no meio do voo)
    if (!mounted || !_sheetController.isAttached || _tocandoLista) return;

    // Desce suave e dá aquele "quique" macio no final
    await _sheetController.animateTo(
      0.65,
      duration: const Duration(milliseconds: 800), 
      curve: Curves.bounceOut,
    );
  }


  // ============================================================================
  // LÓGICA DE DADOS (SUPABASE)
  // ============================================================================

  // ============================================================================
  // MONTAGEM INSTANTÂNEA DE DADOS (COM ORDENAÇÃO PRÉVIA)
  // ============================================================================
  void _montarEscolasPreCarregadas() {
    List<Escola> todasEscolas = [];

    for (var linha in widget.dadosBrutosEscolas) {
      List<TurnoEscola> listaTurnos = [];

      if (linha['turnos_escola'] != null) {
        for (var t in linha['turnos_escola']) {
          String nivelDoTurnoBanco = t['nivel_do_turno'] ?? '';
          if (nivelDoTurnoBanco.isEmpty || nivelDoTurnoBanco.contains(widget.nivelEscolhido)) {
            listaTurnos.add(TurnoEscola(
              id: t['id'], 
              turno: t['turno'] ?? '', 
              horario: t['horario'] ?? 'A combinar',
              descricao: t['descricao'] ?? '', 
              auxilios: t['auxilios'] ?? '', 
              nivelDoTurno: nivelDoTurnoBanco,
              // Mantendo a preparação para o banco de dados dos dias
              diasAula: t['dias_aula'] ?? 'Seg–Qui', 
            ));
          }
        }
      }

      List<String> fotosEscola = [];
      if (linha['image_url'] != null && linha['image_url'].toString().trim().isNotEmpty) {
        fotosEscola = linha['image_url'].toString().split(',').map((e) => e.trim()).toList();
      }

      if (fotosEscola.isEmpty) {
        fotosEscola = [
          'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop',
        ];
      }

      final escola = Escola(
        id: linha['id'], 
        nome: linha['nome'], 
        cidade: linha['cidade'] ?? 'Camboriú',
        bairro: linha['bairro'] ?? 'Centro',
        posicao: LatLng(linha['latitude'], linha['longitude']),
        niveisOferecidos: List<String>.from(linha['niveis_oferecidos']),
        turnos: listaTurnos, 
        imagens: fotosEscola,
      );

      todasEscolas.add(escola);
      _keysEscola[escola.id] = GlobalKey();
    }

    // 1. Filtra as escolas
    List<Escola> listaFiltrada = todasEscolas
        .where((e) => e.niveisOferecidos.contains(widget.nivelEscolhido) && e.turnos.isNotEmpty)
        .toList();

    // 2. A MÁGICA: Calcula a distância e ordena ANTES de aparecer na tela!
    if (widget.posicaoInjetada != null) {
      _minhaLocalizacao = widget.posicaoInjetada;
      
      for (var school in listaFiltrada) {
        school.distanciaMetros = Geolocator.distanceBetween(
          _minhaLocalizacao!.latitude,
          _minhaLocalizacao!.longitude,
          school.posicao.latitude,
          school.posicao.longitude,
        );
      }
      
      // Ordena da mais próxima para a mais distante
      listaFiltrada.sort((a, b) => a.distanciaMetros.compareTo(b.distanciaMetros));
    }

    // 3. Atualiza a tela já com tudo perfeitamente ordenado
    setState(() {
      escolasFiltradas = listaFiltrada;
      _carregandoEscolas = false; 
    });

    if (widget.posicaoInjetada != null) {
      _animarNudgeInicial();
    } else {
      _iniciarMapa();
      _animarNudgeInicial();
    }
  }

  @override
  void dispose() {
    pararVoz();
    _sheetController.removeListener(_onSheetChanged);
    _sheetController.dispose();
    _listaController.dispose();
    super.dispose();
  }

  // ============================================================================
  // MAPA E LOCALIZAÇÃO (MÁGICA DOS QUADRADOS IMPLEMENTADA)
  // ============================================================================

  Future<void> _iniciarMapa() async {
    await _buscarMinhaLocalizacao();
    await _gerarMarcadores();
  }

  Future<void> _buscarMinhaLocalizacao() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return;

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return;
    }

    Position posicaoAtual = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );

    if (mounted) {
      setState(() { _minhaLocalizacao = posicaoAtual; });
      await _calcularDistanciasEGerarMarcadores();
    }
  }

  Future<void> _calcularDistanciasEGerarMarcadores() async {
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
        escolasFiltradas.sort((a, b) => a.distanciaMetros.compareTo(b.distanciaMetros));
      });
      await _gerarMarcadores();
    }

    if (escolasFiltradas.isNotEmpty && _mapController != null) {
      final escolaMaisProxima = escolasFiltradas.first;

      double minLat = min(_minhaLocalizacao!.latitude, escolaMaisProxima.posicao.latitude);
      double maxLat = max(_minhaLocalizacao!.latitude, escolaMaisProxima.posicao.latitude);
      double minLng = min(_minhaLocalizacao!.longitude, escolaMaisProxima.posicao.longitude);
      double maxLng = max(_minhaLocalizacao!.longitude, escolaMaisProxima.posicao.longitude);

      double latDelta = maxLat - minLat;
      double lngDelta = maxLng - minLng;
      
      // Proteção contra zoom extremo se a pessoa estiver na porta da escola
      if (latDelta < 0.005) {
        double centerLat = (maxLat + minLat) / 2;
        minLat = centerLat - 0.0025;
        maxLat = centerLat + 0.0025;
        latDelta = 0.005;
      }
      if (lngDelta < 0.005) {
        double centerLng = (maxLng + minLng) / 2;
        minLng = centerLng - 0.0025;
        maxLng = centerLng + 0.0025;
        lngDelta = 0.005;
      }

      // ========================================================================
      // A MATEMÁTICA DOS QUADRADOS RESPONSIVOS:
      // O espaço visível é o "Quadrado de Cima" (1.0 - _sheetSize).
      // Para empurrar a câmera e centralizar os pinos nesse quadrado de cima, 
      // adicionamos uma margem sul matemática proporcional ao tamanho da caixinha.
      // ========================================================================
      double espacoVisivel = 1.0 - _sheetSize; 
      double margemSul = latDelta * (_sheetSize / espacoVisivel);

      // Respiro para os pinos não baterem no teto ou nas bordas
      double respiroLat = latDelta * 0.3;
      double respiroLng = lngDelta * 0.3;

      // Compensamos o respiro na margem sul para manter a proporção exata
      margemSul += respiroLat * (_sheetSize / espacoVisivel);
      margemSul += 0.015;
      _mapController?.animateCamera(
        CameraUpdate.newLatLngBounds(
          LatLngBounds(
            southwest: LatLng(minLat - margemSul - respiroLat, minLng - respiroLng),
            northeast: LatLng(maxLat + respiroLat, maxLng + respiroLng),
          ),
          0.0, // Retiramos o padding nativo! Agora só a nossa matemática domina.
        ),
      );
    }
  }

  Future<BitmapDescriptor> _criarIconeUsuario() async {
    final size = 54.0; 
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder);
    
    final paintSombra = Paint()
      ..color = const Color(0xFF7C3AED).withAlpha(77) 
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 12);
    
    final paintBorda = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
      
    final paintMiolo = Paint()
      ..color = const Color(0xFF7C3AED) 
      ..style = PaintingStyle.fill;

    final cx = size / 2;
    
    canvas.drawCircle(Offset(cx, cx), cx * 0.5, paintSombra);
    canvas.drawCircle(Offset(cx, cx), cx * 0.35, paintBorda);
    canvas.drawCircle(Offset(cx, cx), cx * 0.25, paintMiolo);

    final picture = recorder.endRecording();
    final img = await picture.toImage(size.toInt(), size.toInt());
    final bytes = await img.toByteData(format: ui.ImageByteFormat.png);
    
    return BitmapDescriptor.bytes(
      Uint8List.view(bytes!.buffer),
      width: size,
      height: size,
    );
  }

  Future<void> _gerarMarcadores() async {
    _marcadores.clear();
    
    if (_minhaLocalizacao != null) {
      final iconeUser = await _criarIconeUsuario();
      _marcadores.add(
        Marker(
          markerId: const MarkerId('meu_local'),
          position: LatLng(_minhaLocalizacao!.latitude, _minhaLocalizacao!.longitude),
          icon: iconeUser,
          zIndex: 999, 
          consumeTapEvents: true, 
        ),
      );
    }

    bool isPrimeira = true;

    for (var school in escolasFiltradas) {
      final cor = (isPrimeira && _minhaLocalizacao != null)
          ? BitmapDescriptor.hueViolet   
          : BitmapDescriptor.hueOrange;  

      _marcadores.add(
        Marker(
          markerId: MarkerId(school.id),
          position: school.posicao,
          icon: BitmapDescriptor.defaultMarkerWithHue(cor),
          consumeTapEvents: true, // Escudo anti-bug
          onTap: () {
            _focarNaEscola(school.posicao);
            _rolarParaEscola(school);
          },
        ),
      );
      isPrimeira = false;
    }
    if (mounted) setState(() {});
  }

  // ============================================================================
  // LÓGICA DE INTERAÇÃO LISTA <-> MAPA
  // ============================================================================

  void _focarNaEscola(LatLng local, {double? tamanhoAlvo}) {
    // ========================================================================
    // MATEMÁTICA DO QUADRADO APLICADA AO CLIQUE
    // Simulamos um quadrado virtual ao redor da escola (que define o nível de zoom)
    // E aplicamos a mesma regra proporcional da Caixinha!
    // ========================================================================
    double deltaFixo = 0.0035; 
    
    double minLat = local.latitude - deltaFixo;
    double maxLat = local.latitude + deltaFixo;
    double minLng = local.longitude - deltaFixo;
    double maxLng = local.longitude + deltaFixo;

    // Usa o tamanho futuro (0.65) se for passado, para o mapa não bugar
    double tamanhoCalculo = tamanhoAlvo ?? _sheetSize;

    double espacoVisivel = 1.0 - tamanhoCalculo;
    double margemSul = (maxLat - minLat) * (tamanhoCalculo / espacoVisivel);

    _mapController?.animateCamera(
      CameraUpdate.newLatLngBounds(
        LatLngBounds(
          southwest: LatLng(minLat - margemSul, minLng),
          northeast: LatLng(maxLat, maxLng),
        ),
        0.0, 
      ),
    );
  }

  void _rolarParaEscola(Escola school) async {
    // 1. A aba sobe até o ponto de leitura ideal
    _sheetController.animateTo(
      0.65,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );

    // Liga o destaque visual
    setState(() { _escolaDestacadaId = school.id; });

    // 2. ESPERA A ABA ESTABILIZAR (Crucial para a lista rolar corretamente)
    await Future.delayed(const Duration(milliseconds: 350));

    final key = _keysEscola[school.id];
    final context = key?.currentContext;
    if (context != null) {
      Scrollable.ensureVisible(
        context,
        duration: const Duration(milliseconds: 600),
        curve: Curves.easeInOut,
        alignment: 0.1, // Margem no topo da lista para ficar bonito
      );
    }

    // 3. Remove o destaque após a visualização
    Future.delayed(const Duration(milliseconds: 2000), () {
      if (mounted && _escolaDestacadaId == school.id) {
        setState(() { _escolaDestacadaId = null; });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final String leituraEscolas = escolasFiltradas.isEmpty
        ? 'Nenhuma escola encontrada.'
        : '${escolasFiltradas.length} escolas disponíveis.';

    return Scaffold(
      backgroundColor: const Color(0xFFF8F7FF),
      appBar: AppBar(
        title: TextoAcessivel(
          texto: 'Escolha sua escola',
          estilo: GoogleFonts.inter(
            fontWeight: FontWeight.w900,
            color: const Color(0xFF1E1B4B),
            fontSize: 18,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Color(0xFF4F46E5)),
        actions: [BotaoAcessibilidadeGlobal(textoLeituraTela: leituraEscolas)],
      ),
      body: Stack(
        children: [

          // ============================================================================
          // MAPA
          // ============================================================================
          Positioned.fill(
            child: IgnorePointer(
              ignoring: kIsWeb && _sheetSize > 0.21,
              child: GoogleMap(
                initialCameraPosition: _posicaoInicial,
                markers: _marcadores,
                myLocationEnabled: false, 
                myLocationButtonEnabled: false,
                zoomControlsEnabled: false,
                compassEnabled: false,
                mapToolbarEnabled: false, 
                scrollGesturesEnabled: !_bloquearMapa,
                zoomGesturesEnabled: !_bloquearMapa,
                tiltGesturesEnabled: !_bloquearMapa,
                rotateGesturesEnabled: !_bloquearMapa,

                

                // O padding foi removido aqui. A nossa Matemática do Quadrado 
                // assumiu 100% do controle responsivo!
                onMapCreated: (controller) async {
                  _mapController = controller;

                  controller.setMapStyle('''
                    [
                      {
                        "featureType": "poi",
                        "stylers": [
                          { "visibility": "off" }
                        ]
                      }
                    ]
                  ''');

                  if (_minhaLocalizacao != null && escolasFiltradas.isNotEmpty) {
                    await _calcularDistanciasEGerarMarcadores();
                  }
                },
              ),
            ),
          ),

          if (_carregandoEscolas)
            Positioned.fill(
              child: Container(
                color: Colors.white.withAlpha(204),
                child: const Center(
                  child: CircularProgressIndicator(color: Color(0xFF4F46E5)),
                ),
              ),
            ),

          // ============================================================================
          // BOTTOM SHEET - A MÁGICA DA FÍSICA DIVIDIDA
          // ============================================================================
          ScrollConfiguration(
            behavior: ScrollConfiguration.of(context).copyWith(
              dragDevices: {
                PointerDeviceKind.touch,
                PointerDeviceKind.mouse,
              },
            ),
            child: DraggableScrollableSheet(
              controller: _sheetController,
              initialChildSize: _sheetInitialSize,
              minChildSize: 0.2,
              maxChildSize: _sheetMaxSize, 
              builder: (BuildContext context, ScrollController scrollController) {
                return Listener(
                  onPointerDown: (_) {
                    _tocandoLista = true;
                    _atualizarBloqueioMapa();
                  },
                  onPointerUp: (_) {
                    _tocandoLista = false;
                    _atualizarBloqueioMapa();
                  },
                  onPointerCancel: (_) {
                    _tocandoLista = false;
                    _atualizarBloqueioMapa();
                  },
                  child: MouseRegion(
                    onEnter: (_) {
                      _mouseSobreLista = true;
                      _atualizarBloqueioMapa();
                    },
                    onExit: (_) {
                      _mouseSobreLista = false;
                      _atualizarBloqueioMapa();
                    },
                    child: GestureDetector(
                      onTap: () {}, // Escudo Anti-Vazamento
                      behavior: HitTestBehavior.opaque, 
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 8),
                        clipBehavior: Clip.antiAlias, 
                        decoration: const BoxDecoration(
                          color: Color(0xFFF8F7FF),
                          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black26, 
                              blurRadius: 15, 
                              offset: Offset(0, -4)
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // 1. ÁREA DE ARRASTO
                            GestureDetector(
                              behavior: HitTestBehavior.opaque,
                              onVerticalDragStart: (_) {
                                setState(() {
                                  _sheetMaxSize = 0.95;
                                  _sheetInitialSize = _sheetController.size.clamp(0.2, 0.95);
                                });
                              },
                              onVerticalDragUpdate: (details) {
                                if (!_sheetController.isAttached) return;
                                final availableHeight = MediaQuery.of(context).size.height - kToolbarHeight - MediaQuery.of(context).padding.top;
                                double delta = details.primaryDelta! / availableHeight;
                                double newSize = (_sheetController.size - delta).clamp(0.2, 0.95);
                                _sheetController.jumpTo(newSize);
                              },
                              onVerticalDragEnd: (_) {
                                setState(() {
                                  _sheetMaxSize = _sheetController.size.clamp(0.2, 0.95);
                                  _sheetInitialSize = _sheetMaxSize;
                                });
                              },
                              onVerticalDragCancel: () {
                                setState(() {
                                  _sheetMaxSize = _sheetController.size.clamp(0.2, 0.95);
                                  _sheetInitialSize = _sheetMaxSize;
                                });
                              },
                              child: Container(
                                decoration: const BoxDecoration(
                                  color: Color(0xFFF8F7FF),
                                  border: Border(
                                    bottom: BorderSide(color: Color(0xFFEDE9FE), width: 1.5),
                                  ),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Center(
                                      child: Container(
                                        margin: const EdgeInsets.only(top: 8, bottom: 0),
                                        height: 24, // Fixa a altura para não dar solavanco
                                        child: AnimatedSwitcher(
                                          duration: const Duration(milliseconds: 300),
                                          transitionBuilder: (Widget child, Animation<double> animation) {
                                            return FadeTransition(opacity: animation, child: child);
                                          },
                                          // Se a gaveta subir mais que 80%, a seta vira um traço plano
                                          child: _sheetSize > 0.8
                                              ? Container(
                                                  key: const ValueKey('traco'),
                                                  margin: const EdgeInsets.only(top: 10),
                                                  width: 36,
                                                  height: 4,
                                                  decoration: BoxDecoration(
                                                    color: Colors.grey.shade300,
                                                    borderRadius: BorderRadius.circular(10),
                                                  ),
                                                )
                                              : Icon(
                                                  Icons.keyboard_arrow_up_rounded,
                                                  key: const ValueKey('seta'),
                                                  color: Colors.grey.shade400,
                                                  size: 26,
                                                ),
                                        ),
                                      ),
                                    ),
                                    Container(
                                      width: double.infinity,
                                      padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                                      child: Row(
                                        children: [
                                          const Icon(
                                            Icons.location_on_rounded, 
                                            color: Color(0xFF7C3AED), 
                                            size: 18
                                          ),
                                          const SizedBox(width: 8),
                                          TextoAcessivel(
                                            texto: '${escolasFiltradas.length} escolas prontas para te receber',
                                            estilo: GoogleFonts.inter(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w500,
                                              color: const Color(0xFF3730A3),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            
                            // ====================================================================
                            // 2. A LISTA DE ESCOLAS ROLANDO INDEPENDENTE COM SOMBREAMENTO
                            // ====================================================================
                            Expanded(
                              child: Stack(
                                children: [
                                  Positioned.fill(
                                    child: NotificationListener<ScrollUpdateNotification>(
                                      onNotification: (notification) {
                                        // MÁGICA AQUI: O "axis == Axis.vertical" ignora as fotos pro lado!
                                        if (notification.metrics.axis == Axis.vertical &&
                                            notification.dragDetails != null && 
                                            notification.scrollDelta != null && 
                                            notification.scrollDelta! > 2.5) {
                                          if (!_jaExpandiu && _sheetSize < 0.9) {
                                            _jaExpandiu = true; 
                                            _sheetController.animateTo(
                                              0.95, 
                                              duration: const Duration(milliseconds: 850), 
                                              curve: Curves.fastLinearToSlowEaseIn, 
                                            );
                                          }
                                        }
                                        return false; 
                                      },
                                      child: SingleChildScrollView(
                                        controller: scrollController, 
                                        physics: const AlwaysScrollableScrollPhysics(), 
                                        padding: const EdgeInsets.all(20),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.stretch,
                                          children: escolasFiltradas.asMap().entries.map((entry) {
                                            final index = entry.key;
                                            final school = entry.value;
                                            final bool isHighlighted = _escolaDestacadaId == school.id;
                                            final bool isMaisProximo = index == 0 && _minhaLocalizacao != null;
                                            final GlobalKey itemKey = _keysEscola.putIfAbsent(
                                              school.id,
                                              () => GlobalKey(),
                                            );

                                          return _CardEscola(
                                              key: itemKey,
                                              escola: school,
                                              isHighlighted: isHighlighted,
                                              isMaisProximo: isMaisProximo,
                                              minhaLocalizacao: _minhaLocalizacao,
                                              nivelEscolhido: widget.nivelEscolhido,
                                              onCardTap: () {
                                                // 1. O mapa usa 0.65 para calcular o centro antes mesmo da gaveta descer
                                                _focarNaEscola(school.posicao, tamanhoAlvo: 0.65);
                                                
                                                // 2. Chama a função que desce a gaveta, DÁ O DESTAQUE NA BORDA e rola a lista
                                                _rolarParaEscola(school);
                                              },
                                            );
                                          }).toList(),
                                        ),
                                      ),
                                    ),
                                  ),
                                  // EFEITO DE PROFUNDIDADE (Fade esfumaçado na base da lista)
                                  Positioned(
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: 32, // Altura da sombra
                                    child: IgnorePointer(
                                      child: Container(
                                        decoration: BoxDecoration(
                                          gradient: LinearGradient(
                                            begin: Alignment.topCenter,
                                            end: Alignment.bottomCenter,
                                            colors: [
                                              const Color(0xFFF8F7FF).withAlpha(0), // Transparente em cima
                                              const Color(0xFFF8F7FF), // Cor sólida da aba embaixo
                                            ],
                                          ),
                                        ),
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
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// WIDGET DO CARD DA ESCOLA (ESTILO AIRBNB / PREMIUM UX)
// ============================================================================

class _CardEscola extends StatefulWidget {
  final Escola escola;
  final bool isHighlighted;
  final bool isMaisProximo;
  final Position? minhaLocalizacao;
  final String nivelEscolhido;
  final VoidCallback? onCardTap;

  const _CardEscola({
    super.key,
    required this.escola,
    required this.isHighlighted,
    required this.isMaisProximo,
    this.minhaLocalizacao,
    required this.nivelEscolhido,
    this.onCardTap,
  });

  @override
  State<_CardEscola> createState() => _CardEscolaState();
}

class _CardEscolaState extends State<_CardEscola> {
  int _fotoAtual = 0;

  String _formatarDistancia(double metros) {
    if (metros < 1000) {
      return '${metros.toInt()} m';
    } else {
      return '${(metros / 1000).toStringAsFixed(1)} km';
    }
  }

  // MANTIDO PARA USO FUTURO
  String _calcularTempoCarro(double metros) {
    int minutos = (metros / 417).ceil();
    if (minutos < 1) minutos = 1;
    return '$minutos min';
  }

  List<String> _obterTurnosUnicos() {
    return widget.escola.turnos.map((t) => t.turno).toSet().toList();
  }

  List<String> _obterBeneficiosUnicos() {
    final Set<String> beneficios = {};
    for (var t in widget.escola.turnos) {
      final partes = t.auxilios.split(RegExp(r'[,\n]'));
      for (var p in partes) {
        if (p.trim().isNotEmpty) {
          beneficios.add(p.trim());
        }
      }
    }
    return beneficios.toList();
  }

  Widget _buildTagChip({
    required String texto,
    required Color corFundo,
    required Color corTexto,
    required IconData icone,
    required Color corIcone,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: corFundo,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icone, size: 12, color: corIcone),
          const SizedBox(width: 4),
          Text(
            texto,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: corTexto,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final List<String> turnos = _obterTurnosUnicos();
    final List<String> beneficios = _obterBeneficiosUnicos();
    final int totalFotos = widget.escola.imagens.length;
    return FadeInUp(
      duration: const Duration(milliseconds: 400),
      child: Padding(
        padding: const EdgeInsets.only(bottom: 16),
        // O GESTURE DETECTOR AQUI FAZ O CARD TODO SER CLICÁVEL!
        child: GestureDetector(
          onTap: widget.onCardTap,
          behavior: HitTestBehavior.opaque,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 400),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: widget.isHighlighted
                    ? const Color(0xFF7C3AED)
                    : const Color(0xFFE0DAFA),
                width: widget.isHighlighted ? 2.0 : 0.5,
              ),
              boxShadow: [
                if (widget.isHighlighted)
                  BoxShadow(
                    color: const Color(0xFF7C3AED).withAlpha(77),
                    blurRadius: 15,
                    offset: const Offset(0, 4),
                  ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
              // ==============================================================
              // FOTO MAIOR COM BADGE FLUTUANTE 
              // ==============================================================
              Container(
                height: 140, 
                width: double.infinity,
                decoration: const BoxDecoration(
                  color: Color(0xFFEDE9FE),
                  borderRadius: BorderRadius.vertical(top: Radius.circular(15)),
                ),
                child: totalFotos == 0
                    ? Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.school_rounded, size: 50, color: Color(0xFFC4B5FD)),
                          const SizedBox(height: 8),
                          Text(
                            'Foto da Escola',
                            style: TextStyle(
                              color: const Color(0xFF818CF8).withAlpha(178),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      )
                    : Stack(
                        children: [
                          ClipRRect(
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                            child: PageView.builder(
                              scrollBehavior: ScrollConfiguration.of(context).copyWith(
                                dragDevices: {
                                  PointerDeviceKind.touch,
                                  PointerDeviceKind.mouse,
                                },
                              ),
                              itemCount: totalFotos,
                              onPageChanged: (index) {
                                setState(() { _fotoAtual = index; });
                              },
                              itemBuilder: (context, idx) {
                                return Image.network(
                                  widget.escola.imagens[idx],
                                  fit: BoxFit.cover,
                                  width: double.infinity,
                                  loadingBuilder: (context, child, progress) {
                                    if (progress == null) return child;
                                    return Container(
                                      color: const Color(0xFFEDE9FE),
                                      child: const Center(
                                        child: CircularProgressIndicator(
                                          color: Color(0xFF7C3AED),
                                          strokeWidth: 2,
                                        ),
                                      ),
                                    );
                                  },
                                  errorBuilder: (context, error, stack) {
                                    return Container(
                                      color: const Color(0xFFEDE9FE),
                                      child: const Column(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(
                                            Icons.broken_image_rounded, 
                                            size: 40, 
                                            color: Color(0xFFC4B5FD)
                                          ),
                                          SizedBox(height: 8),
                                          Text(
                                            'Imagem indisponível',
                                            style: TextStyle(
                                              color: Color(0xFF818CF8), 
                                              fontSize: 12
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                );
                              },
                            ),
                          ),
                          
                          if (widget.isMaisProximo)
                            Positioned(
                              top: 12,
                              left: 12,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(20),
                                  boxShadow: const [
                                    BoxShadow(
                                      color: Colors.black12, 
                                      blurRadius: 4, 
                                      offset: Offset(0, 2)
                                    )
                                  ],
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.location_on_rounded, size: 14, color: Color(0xFF7C3AED)),
                                    const SizedBox(width: 4),
                                    Text(
                                      'MAIS PRÓXIMA', 
                                      style: GoogleFonts.inter(
                                        fontSize: 11, 
                                        fontWeight: FontWeight.w800, 
                                        color: const Color(0xFF1E1B4B)
                                      )
                                    ),
                                  ],
                                ),
                              ),
                            ),

                          if (totalFotos > 1)
                            Positioned(
                              bottom: 10,
                              left: 0,
                              right: 0,
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: List.generate(
                                  totalFotos,
                                  (idx) => AnimatedContainer(
                                    duration: const Duration(milliseconds: 300),
                                    margin: const EdgeInsets.symmetric(horizontal: 4),
                                    width: _fotoAtual == idx ? 18 : 6,
                                    height: 6,
                                    decoration: BoxDecoration(
                                      color: _fotoAtual == idx
                                          ? Colors.white
                                          : Colors.white.withAlpha(128),
                                      borderRadius: BorderRadius.circular(3),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
              ),

              // ==============================================================
              // ÁREA DE INFORMAÇÕES SUPER COMPACTA
              // ==============================================================
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [

                    TextoAcessivel(
                      texto: widget.escola.nome,
                      estilo: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF1E1B4B),
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 6),

                    Text(
                      widget.minhaLocalizacao != null
                          ? '${widget.escola.cidade} • ${_formatarDistancia(widget.escola.distanciaMetros)} do seu local atual.'
                          : '${widget.escola.cidade} • Calculando...',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: const Color(0xFF455A64),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 12),

                    Text(
                      'Turnos disponíveis:',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey.shade500,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: turnos.map((t) => _buildTagChip(
                        texto: t,
                        corFundo: const Color(0xFFF0EEFF),
                        corTexto: const Color(0xFF6C4DD4),
                        icone: Icons.schedule_rounded,
                        corIcone: const Color(0xFF6C4DD4),
                      )).toList(),
                    ),
                    const SizedBox(height: 12),

                    if (beneficios.isNotEmpty) ...[
                      Text(
                        'Benefícios oferecidos:',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey.shade500,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: beneficios.take(4).map((b) => _buildTagChip(
                          texto: b,
                          corFundo: const Color(0xFFEAF3DE),
                          corTexto: const Color(0xFF2E7D32),
                          icone: Icons.check_circle_outline_rounded,
                          corIcone: const Color(0xFF4CAF50),
                        )).toList(),
                      ),
                      const SizedBox(height: 8),
                    ],
                  ],
                ),
              ),

              // BOTÃO E MENSAGEM ACOLHEDORA DE CONFIANÇA
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                child: Column(
                  children: [
                    SizedBox(
                      width: double.infinity,
                      height: 42,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF7C3AED),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                        onPressed: () {
                          pararVoz();
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => TelaDetalhes(
                                idEscola: widget.escola.id,
                                nomeEscola: widget.escola.nome,
                                bairro: widget.escola.bairro,
                                cidade: widget.escola.cidade,
                                nivel: widget.nivelEscolhido,
                                turnos: widget.escola.turnos,
                                distancia: _formatarDistancia(widget.escola.distanciaMetros),
                              ),
                            ),
                          );
                        },
                        child: const TextoAcessivel(
                          texto: 'Ver Escola',
                          corIcone: Colors.white,
                          estilo: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.favorite_border_rounded, 
                          size: 14, 
                          color: Colors.grey.shade500
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Inscrição gratuita • sem burocracia',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: Colors.grey.shade500,
                          ),
                        ),
                      ],
                    ),
                  ],
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