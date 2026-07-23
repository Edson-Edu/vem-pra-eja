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
import '../paleta.dart';
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
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: Paleta.fundoGeral,
        border: Border(
          bottom: BorderSide(color: Colors.grey.shade300, width: 1.5),
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
                  color: Paleta.azulIcones,
                  size: 18,
                ),
                const SizedBox(width: 8),
                TextoAcessivel(
                  texto: '$quantidadeEscolas escolas prontas para te receber',
                  textoOcultoParaLer: 'Temos ${quantidadeEscolas == 2 ? "duas" : quantidadeEscolas == 1 ? "uma" : quantidadeEscolas} escolas prontas para te receber nesta região.',
                  estilo: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: Paleta.textoDestaque,
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
      _jaExpandiu = false;
    }

    if ((size - _sheetSize).abs() > 0.001) {
      setState(() {
        _sheetSize = size;
      });
    }
  }

  void _animarNudgeInicial() async {
    await Future.delayed(const Duration(milliseconds: 1500));
    if (!mounted || !_sheetController.isAttached || _tocandoLista || (_sheetSize - 0.65).abs() > 0.02) {
      return;
    }

    await _sheetController.animateTo(
      0.72,
      duration: const Duration(milliseconds: 600),
      curve: Curves.easeOutCubic,
    );

    await Future.delayed(const Duration(milliseconds: 150));
    if (!mounted || !_sheetController.isAttached || _tocandoLista) return;

    await _sheetController.animateTo(
      0.65,
      duration: const Duration(milliseconds: 800),
      curve: Curves.bounceOut,
    );
  }

  void _montarEscolasPreCarregadas() {
    List<Escola> todasEscolas = [];

    for (var linha in widget.dadosBrutosEscolas) {
      List<TurnoEscola> listaTurnos = [];

      if (linha['turnos_escola'] != null) {
        for (var t in linha['turnos_escola']) {
          String nivelDoTurnoBanco = t['nivel_do_turno'] ?? '';
          if (nivelDoTurnoBanco.isEmpty || nivelDoTurnoBanco.contains(widget.nivelEscolhido)) {
            listaTurnos.add(
              TurnoEscola(
                id: t['id'],
                turno: t['turno'] ?? '',
                horario: t['horario'] ?? 'A combinar',
                descricao: t['descricao'] ?? '',
                auxilios: t['auxilios'] ?? '',
                nivelDoTurno: nivelDoTurnoBanco,
                diasAula: t['dias_aula'] ?? 'Seg–Qui',
              ),
            );
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

    List<Escola> listaFiltrada = todasEscolas.where((e) => e.niveisOferecidos.contains(widget.nivelEscolhido) && e.turnos.isNotEmpty).toList();

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
      listaFiltrada.sort((a, b) => a.distanciaMetros.compareTo(b.distanciaMetros));
    }

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

    Position posicaoAtual = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);

    if (mounted) {
      setState(() {
        _minhaLocalizacao = posicaoAtual;
      });
      await _calcularDistanciasEGerarMarcadores();
    }
  }

  Future<void> _calcularDistanciasEGerarMarcadores() async {
    if (mounted && _minhaLocalizacao != null) {
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
    }

    if (mounted) {
      await _gerarMarcadores();
    }

    if (escolasFiltradas.isNotEmpty && _mapController != null) {
      double minLat = escolasFiltradas.first.posicao.latitude;
      double maxLat = minLat;
      double minLng = escolasFiltradas.first.posicao.longitude;
      double maxLng = minLng;

      if (_minhaLocalizacao != null) {
        minLat = min(_minhaLocalizacao!.latitude, minLat);
        maxLat = max(_minhaLocalizacao!.latitude, maxLat);
        minLng = min(_minhaLocalizacao!.longitude, minLng);
        maxLng = max(_minhaLocalizacao!.longitude, maxLng);
      } else {
        for (var school in escolasFiltradas) {
          minLat = min(school.posicao.latitude, minLat);
          maxLat = max(school.posicao.latitude, maxLat);
          minLng = min(school.posicao.longitude, minLng);
          maxLng = max(school.posicao.longitude, maxLng);
        }
      }

      double latDelta = maxLat - minLat;
      double lngDelta = maxLng - minLng;

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

      double espacoVisivel = 1.0 - _sheetSize;
      double margemSul = latDelta * (_sheetSize / espacoVisivel);
      double respiroLat = latDelta * 0.3;
      double respiroLng = lngDelta * 0.3;
      margemSul += respiroLat * (_sheetSize / espacoVisivel);
      margemSul += 0.015;

      _mapController?.animateCamera(
        CameraUpdate.newLatLngBounds(
          LatLngBounds(
            southwest: LatLng(minLat - margemSul - respiroLat, minLng - respiroLng),
            northeast: LatLng(maxLat + respiroLat, maxLng + respiroLng),
          ),
          0.0,
        ),
      );
    }
  }

  Future<BitmapDescriptor> _criarIconeUsuario() async {
    final size = 54.0;
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder);

    final paintSombra = Paint()..color = Paleta.azulPrincipal.withAlpha(77)..maskFilter = const MaskFilter.blur(BlurStyle.normal, 12);
    final paintBorda = Paint()..color = Colors.white..style = PaintingStyle.fill;
    final paintMiolo = Paint()..color = Paleta.azulPrincipal..style = PaintingStyle.fill;

    final cx = size / 2;
    canvas.drawCircle(Offset(cx, cx), cx * 0.5, paintSombra);
    canvas.drawCircle(Offset(cx, cx), cx * 0.35, paintBorda);
    canvas.drawCircle(Offset(cx, cx), cx * 0.25, paintMiolo);

    final picture = recorder.endRecording();
    final img = await picture.toImage(size.toInt(), size.toInt());
    final bytes = await img.toByteData(format: ui.ImageByteFormat.png);

    return BitmapDescriptor.bytes(Uint8List.view(bytes!.buffer), width: size, height: size);
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
      final cor = (isPrimeira && _minhaLocalizacao != null) ? BitmapDescriptor.hueAzure : BitmapDescriptor.hueOrange;
      _marcadores.add(
        Marker(
          markerId: MarkerId(school.id),
          position: school.posicao,
          icon: BitmapDescriptor.defaultMarkerWithHue(cor),
          consumeTapEvents: true,
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

  void _focarNaEscola(LatLng local, {double? tamanhoAlvo}) {
    double deltaFixo = 0.0035;
    double minLat = local.latitude - deltaFixo;
    double maxLat = local.latitude + deltaFixo;
    double minLng = local.longitude - deltaFixo;
    double maxLng = local.longitude + deltaFixo;

    double tamanhoCalculo = tamanhoAlvo ?? _sheetSize;
    double espacoVisivel = 1.0 - tamanhoCalculo;
    double margemSul = (maxLat - minLat) * (tamanhoCalculo / espacoVisivel);

    _mapController?.animateCamera(
      CameraUpdate.newLatLngBounds(
        LatLngBounds(southwest: LatLng(minLat - margemSul, minLng), northeast: LatLng(maxLat, maxLng)),
        0.0,
      ),
    );
  }

  void _rolarParaEscola(Escola school) async {
    _sheetController.animateTo(0.65, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
    setState(() { _escolaDestacadaId = school.id; });
    await Future.delayed(const Duration(milliseconds: 350));

    final key = _keysEscola[school.id];
    final context = key?.currentContext;
    if (context != null) {
      Scrollable.ensureVisible(context, duration: const Duration(milliseconds: 600), curve: Curves.easeInOut, alignment: 0.1);
    }

    Future.delayed(const Duration(milliseconds: 2000), () {
      if (mounted && _escolaDestacadaId == school.id) {
        setState(() { _escolaDestacadaId = null; });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final Size screenSize = MediaQuery.of(context).size;
    final targetPlatform = Theme.of(context).platform;
    final bool isDispositivoMovel = targetPlatform == TargetPlatform.android || targetPlatform == TargetPlatform.iOS;
    
    final bool ehTabletReal = isDispositivoMovel && screenSize.shortestSide >= 600;
    final bool ehTelaGrandeComputador = !isDispositivoMovel && screenSize.width > 1280;

    String qtdAudio = escolasFiltradas.length == 2 ? 'duas' : escolasFiltradas.length == 1 ? 'uma' : escolasFiltradas.length.toString();
    final String leituraEscolas = escolasFiltradas.isEmpty
        ? 'No momento, não encontramos escolas disponíveis para esta pesquisa.'
        : 'Encontramos $qtdAudio escolas prontas para te receber. Deslize a lista para explorar cada uma delas ou navegue diretamente pelo mapa.';

    // ============================================================================
    // CONTEÚDO PURO DA LISTA DE ESCOLAS (COMPARTILHADO ENTRE MOBILE E DESKTOP)
    // ============================================================================
    Widget construirListaEscolasPura(ScrollController controller, {EdgeInsets? padding}) {
      return SingleChildScrollView(
        controller: controller,
        physics: const AlwaysScrollableScrollPhysics(),
        padding: padding ?? const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: escolasFiltradas.asMap().entries.map((entry) {
            final index = entry.key; final school = entry.value;
            final bool isHighlighted = _escolaDestacadaId == school.id;
            final bool isMaisProximo = index == 0 && _minhaLocalizacao != null;
            final GlobalKey itemKey = _keysEscola.putIfAbsent(school.id, () => GlobalKey());

            return _CardEscola(
              key: itemKey, escola: school, isHighlighted: isHighlighted, isMaisProximo: isMaisProximo, minhaLocalizacao: _minhaLocalizacao, nivelEscolhido: widget.nivelEscolhido,
              onCardTap: () { _focarNaEscola(school.posicao, tamanhoAlvo: ehTelaGrandeComputador ? 0.35 : 0.65); _rolarParaEscola(school); },
            );
          }).toList(),
        ),
      );
    }

    // ============================================================================
    // CORPO DA TELA BASEADO NO TIPO DE DISPOSITIVO
    // ============================================================================
    Widget corpoDaTela;

    if (ehTelaGrandeComputador) {
      // REQUISITO DESKTOP: Divisão lado a lado. Lista na esquerda (1/3) e Mapa na direita (2/3)
      corpoDaTela = Row(
        children: [
          // GAVETA LATERAL FIXA DA ESQUERDA (Ocupa 1/3 exato do espaço horizontal)
          Container(
            width: MediaQuery.of(context).size.width * 0.33, // <-- MUDANÇA AQUI
            color: Paleta.fundoGeral,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Cabeçalho estável da esquerda
                Container(
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
                  decoration: const BoxDecoration(
                    color: Paleta.fundoGeral,
                    border: Border(bottom: BorderSide(color: Color(0xFFEDE9FE), width: 1.5))
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.location_on_rounded, color: Paleta.azulIcones, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '${escolasFiltradas.length} escolas prontas para te receber', 
                          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: Paleta.textoDestaque)
                        ),
                      ),
                    ],
                  ),
                ),
                // Lista de cartões rolável independente à esquerda
                Expanded(
                  child: construirListaEscolasPura(_listaController, padding: const EdgeInsets.all(16)),
                ),
              ],
            ),
          ),
          // MAPA OCUPANDO O RESTANTE DA TELA NA DIREITA
          Expanded(
            child: GoogleMap(
              initialCameraPosition: _posicaoInicial,
              markers: _marcadores,
              myLocationEnabled: false,
              myLocationButtonEnabled: false,
              zoomControlsEnabled: true, // Habilitado no PC para facilitar com o rato
              compassEnabled: false,
              mapToolbarEnabled: false,
              onMapCreated: (controller) async {
                _mapController = controller;
                controller.setMapStyle('[{"featureType": "poi","stylers": [{"visibility": "off"}]}]');
                if (escolasFiltradas.isNotEmpty) await _calcularDistanciasEGerarMarcadores();
              },
            ),
          ),
        ],
      );
    } else {
      // LAYOUT MOBILE/TABLET COMPORTAMENTO ORIGINAL DE GAVETA INFERIOR (STACK)
      corpoDaTela = Stack(
        children: [
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
                onMapCreated: (controller) async {
                  _mapController = controller;
                  controller.setMapStyle('[{"featureType": "poi","stylers": [{"visibility": "off"}]}]');
                  if (escolasFiltradas.isNotEmpty) await _calcularDistanciasEGerarMarcadores();
                },
              ),
            ),
          ),

          if (_carregandoEscolas)
            Positioned.fill(
              child: Container(
                color: Colors.white.withAlpha(204),
                child: const Center(child: CircularProgressIndicator(color: Paleta.azulPrincipal)),
              ),
            ),

          ScrollConfiguration(
            behavior: ScrollConfiguration.of(context).copyWith(dragDevices: {PointerDeviceKind.touch, PointerDeviceKind.mouse}),
            child: DraggableScrollableSheet(
              controller: _sheetController,
              initialChildSize: _sheetInitialSize,
              minChildSize: 0.2,
              maxChildSize: _sheetMaxSize,
              builder: (BuildContext context, ScrollController scrollController) {
                return Listener(
                  onPointerDown: (_) { _tocandoLista = true; _atualizarBloqueioMapa(); },
                  onPointerUp: (_) { _tocandoLista = false; _atualizarBloqueioMapa(); },
                  onPointerCancel: (_) { _tocandoLista = false; _atualizarBloqueioMapa(); },
                  child: MouseRegion(
                    onEnter: (_) { _mouseSobreLista = true; _atualizarBloqueioMapa(); },
                    onExit: (_) { _mouseSobreLista = false; _atualizarBloqueioMapa(); },
                    child: GestureDetector(
                      onTap: () {}, 
                      behavior: HitTestBehavior.opaque,
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 8),
                        clipBehavior: Clip.antiAlias,
                        decoration: const BoxDecoration(color: Paleta.fundoGeral, borderRadius: BorderRadius.vertical(top: Radius.circular(24)), boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 15, offset: Offset(0, -4))]),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            GestureDetector(
                              behavior: HitTestBehavior.opaque,
                              onVerticalDragStart: (_) { setState(() { _sheetMaxSize = 0.95; _sheetInitialSize = _sheetController.size.clamp(0.2, 0.95); }); },
                              onVerticalDragUpdate: (details) {
                                if (!_sheetController.isAttached) return;
                                final availableHeight = MediaQuery.of(context).size.height - kToolbarHeight - MediaQuery.of(context).padding.top;
                                double delta = details.primaryDelta! / availableHeight;
                                double newSize = (_sheetController.size - delta).clamp(0.2, 0.95);
                                _sheetController.jumpTo(newSize);
                              },
                              onVerticalDragEnd: (_) { setState(() { _sheetMaxSize = _sheetController.size.clamp(0.2, 0.95); _sheetInitialSize = _sheetMaxSize; }); },
                              onVerticalDragCancel: () { setState(() { _sheetMaxSize = _sheetController.size.clamp(0.2, 0.95); _sheetInitialSize = _sheetMaxSize; }); },
                              child: Container(
                                decoration: const BoxDecoration(color: Paleta.fundoGeral, border: Border(bottom: BorderSide(color: Color(0xFFEDE9FE), width: 1.5))),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Center(
                                      child: Container(
                                        margin: const EdgeInsets.only(top: 8, bottom: 0),
                                        height: 24,
                                        child: AnimatedSwitcher(
                                          duration: const Duration(milliseconds: 300),
                                          transitionBuilder: (Widget child, Animation<double> animation) => FadeTransition(opacity: animation, child: child),
                                          child: _sheetSize > 0.8
                                              ? Container(key: const ValueKey('traco'), margin: const EdgeInsets.only(top: 10), width: 36, height: 4, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10)))
                                              : Icon(Icons.keyboard_arrow_up_rounded, key: const ValueKey('seta'), color: Colors.grey.shade400, size: 26),
                                        ),
                                      ),
                                    ),
                                    Container(
                                      width: double.infinity, padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                                      child: Row(
                                        children: [
                                          const Icon(Icons.location_on_rounded, color: Paleta.azulIcones, size: 18),
                                          const SizedBox(width: 8),
                                          TextoAcessivel(texto: '${escolasFiltradas.length} escolas prontas para te receber', estilo: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: Paleta.textoDestaque)),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            Expanded(
                              child: Stack(
                                children: [
                                  Positioned.fill(
                                    child: NotificationListener<ScrollUpdateNotification>(
                                      onNotification: (notification) {
                                        if (notification.metrics.axis == Axis.vertical && notification.dragDetails != null && notification.scrollDelta != null && notification.scrollDelta! > 2.5) {
                                          if (!_jaExpandiu && _sheetSize < 0.9) {
                                            _jaExpandiu = true;
                                            _sheetController.animateTo(0.95, duration: const Duration(milliseconds: 850), curve: Curves.fastLinearToSlowEaseIn);
                                          }
                                        }
                                        return false;
                                      },
                                      child: construirListaEscolasPura(scrollController),
                                    ),
                                  ),
                                  Positioned(bottom: 0, left: 0, right: 0, height: 32, child: IgnorePointer(child: Container(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Paleta.fundoGeral.withAlpha(0), Paleta.fundoGeral]))))),
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
      );
    }

    return Scaffold(
      backgroundColor: Paleta.fundoGeral,
      appBar: AppBar(
        title: Text(
          'Escolha sua escola',
          style: GoogleFonts.inter(fontWeight: FontWeight.w900, color: Paleta.textoPrincipal, fontSize: ehTabletReal ? 26 : 18),
        ),
        backgroundColor: Paleta.cardBranco,
        elevation: 0,
        centerTitle: true,
        toolbarHeight: ehTabletReal ? 120 : 70,
        leadingWidth: ehTabletReal ? 110 : 75,
        leading: Align(
          alignment: Alignment.centerLeft,
          child: Padding(
            padding: EdgeInsets.only(left: ehTabletReal ? 24.0 : 16.0),
            child: SizedBox(
              width: ehTabletReal ? 56 : 40, height: ehTabletReal ? 56 : 40,
              child: IconButton(
                padding: EdgeInsets.zero,
                icon: Container(
                  alignment: Alignment.center,
                  decoration: BoxDecoration(color: Colors.grey.shade100, shape: BoxShape.circle),
                  child: Icon(Icons.arrow_back_ios_new_rounded, color: Paleta.azulIcones, size: ehTabletReal ? 24 : 16),
                ),
                onPressed: () { pararVoz(); Navigator.pop(context); },
              ),
            ),
          ),
        ),
        actions: [
          Align(
            alignment: Alignment.centerRight,
            child: Container(
              margin: EdgeInsets.only(right: ehTabletReal ? 24 : 16),
              width: ehTabletReal ? 56 : 40, height: ehTabletReal ? 56 : 40,
              decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
              child: BotaoAcessibilidadeGlobal(textoLeituraTela: leituraEscolas),
            ),
          )
        ],
      ),
      body: corpoDaTela,
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
    if (metros < 1000) return '${metros.toInt()} m';
    return '${(metros / 1000).toStringAsFixed(1)} km';
  }

  List<String> _obterTurnosUnicos() {
    return widget.escola.turnos.map((t) => t.turno).toSet().toList();
  }

  List<String> _obterBeneficiosUnicos() {
    final Set<String> beneficios = {};
    for (var t in widget.escola.turnos) {
      final partes = t.auxilios.split(RegExp(r'[,\n]'));
      for (var p in partes) {
        if (p.trim().isNotEmpty) beneficios.add(p.trim());
      }
    }
    return beneficios.toList();
  }

  String _expandirSiglasParaAudio(String texto) {
    if (texto.isEmpty) return texto;
    String limpo = texto;
    limpo = limpo.replaceAll(RegExp(r'\bCEJA\b', caseSensitive: false), 'Centro de Educação de Jovens e Adultos')
                 .replaceAll(RegExp(r'\bEBM\b', caseSensitive: false), 'Escola Básica Municipal')
                 .replaceAll(RegExp(r'\bE\.B\.M\.?\b', caseSensitive: false), 'Escola Básica Municipal')
                 .replaceAll(RegExp(r'\bCEM\b', caseSensitive: false), 'Centro Educacional Municipal')
                 .replaceAll(RegExp(r'\bC\.E\.M\.?\b', caseSensitive: false), 'Centro Educacional Municipal')
                 .replaceAll(RegExp(r'\bEEB\b', caseSensitive: false), 'Escola de Educação Básica')
                 .replaceAll(RegExp(r'\bEJA\b', caseSensitive: false), 'Êja');
    limpo = limpo.replaceAll('Seg', 'segunda').replaceAll('Ter', 'terça').replaceAll('Qua', 'quarta').replaceAll('Qui', 'quinta').replaceAll('Sex', 'sexta').replaceAll('Sab', 'sábado').replaceAll('Sáb', 'sábado').replaceAll('Dom', 'domingo');
    limpo = limpo.replaceAll(' - ', ' a ').replaceAll(' – ', ' a ').replaceAll('-', ' a ').replaceAll('–', ' a ');
    return limpo;
  }

  Widget _buildTagChip({required String texto, required Color corFundo, required Color corTexto, required IconData icone, required Color corIcone, required double escala}) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8 * escala, vertical: 4 * escala),
      decoration: BoxDecoration(color: corFundo, borderRadius: BorderRadius.circular(16 * escala)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icone, size: 12 * escala, color: corIcone),
          SizedBox(width: 4 * escala),
          Text(texto, style: GoogleFonts.inter(fontSize: 11 * escala, fontWeight: FontWeight.bold, color: corTexto)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final Size screenSize = MediaQuery.of(context).size;
    final targetPlatform = Theme.of(context).platform;
    final bool isDispositivoMovel = targetPlatform == TargetPlatform.android || targetPlatform == TargetPlatform.iOS;
    final bool ehTabletReal = isDispositivoMovel && screenSize.shortestSide >= 600;

    double escalaCard = ehTabletReal ? 1.4 : 1.0;

    final List<String> turnos = _obterTurnosUnicos();
    final List<String> beneficios = _obterBeneficiosUnicos();
    final int totalFotos = widget.escola.imagens.length;

    return FadeInUp(
      duration: const Duration(milliseconds: 400),
      child: Padding(
        padding: EdgeInsets.only(bottom: 16 * escalaCard),
        child: GestureDetector(
          onTap: widget.onCardTap, behavior: HitTestBehavior.opaque,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 400),
            decoration: BoxDecoration(color: Paleta.cardBranco, borderRadius: BorderRadius.circular(16 * escalaCard), border: Border.all(color: widget.isHighlighted ? Paleta.azulBotao : Colors.grey.shade300, width: widget.isHighlighted ? 2.0 : 0.5), boxShadow: [if (widget.isHighlighted) BoxShadow(color: Paleta.azulBotao.withAlpha(50), blurRadius: 15 * escalaCard, offset: Offset(0, 4 * escalaCard))]),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 140 * escalaCard, width: double.infinity,
                  decoration: const BoxDecoration(color: Paleta.fundoGeral, borderRadius: BorderRadius.vertical(top: Radius.circular(15))),
                  child: totalFotos == 0
                      ? Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.school_rounded, size: 50 * escalaCard, color: Paleta.azulIcones),
                            const SizedBox(height: 8),
                            Text('Foto da Escola', style: TextStyle(color: Paleta.textoSecundario, fontWeight: FontWeight.bold, fontSize: 14 * escalaCard)),
                          ],
                        )
                      : Stack(
                          children: [
                            ClipRRect(
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                              child: PageView.builder(
                                scrollBehavior: ScrollConfiguration.of(context).copyWith(dragDevices: {PointerDeviceKind.touch, PointerDeviceKind.mouse}),
                                itemCount: totalFotos,
                                onPageChanged: (index) { setState(() { _fotoAtual = index; }); },
                                itemBuilder: (context, idx) {
                                  return Image.network(
                                    widget.escola.imagens[idx], fit: BoxFit.cover, width: double.infinity,
                                    loadingBuilder: (context, child, progress) => progress == null ? child : Container(color: Paleta.fundoGeral, child: Center(child: CircularProgressIndicator(color: Paleta.azulPrincipal, strokeWidth: 2))),
                                    errorBuilder: (context, error, stack) => Container(color: Paleta.fundoGeral, child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.broken_image_rounded, size: 40 * escalaCard, color: Paleta.azulIcones), const SizedBox(height: 8), Text('Imagem indisponível', style: TextStyle(color: Paleta.textoSecundario, fontSize: 12 * escalaCard))])),
                                  );
                                },
                              ),
                            ),
                            if (widget.isMaisProximo)
                              Positioned(
                                top: 12 * escalaCard, left: 12 * escalaCard,
                                child: Container(
                                  padding: EdgeInsets.symmetric(horizontal: 10 * escalaCard, vertical: 6 * escalaCard),
                                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20 * escalaCard), boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))]),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.location_on_rounded, size: 14 * escalaCard, color: Paleta.azulIcones),
                                      SizedBox(width: 4 * escalaCard),
                                      Text('MAIS PRÓXIMA', style: GoogleFonts.inter(fontSize: 11 * escalaCard, fontWeight: FontWeight.w800, color: Paleta.textoPrincipal)),
                                    ],
                                  ),
                                ),
                              ),
                            if (totalFotos > 1)
                              Positioned(
                                bottom: 10 * escalaCard, left: 0, right: 0,
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: List.generate(totalFotos, (idx) => AnimatedContainer(duration: const Duration(milliseconds: 300), margin: const EdgeInsets.symmetric(horizontal: 4), width: _fotoAtual == idx ? (18 * escalaCard) : (6 * escalaCard), height: 6 * escalaCard, decoration: BoxDecoration(color: _fotoAtual == idx ? Colors.white : Colors.white.withAlpha(128), borderRadius: BorderRadius.circular(3)))),
                                ),
                              ),
                          ],
                        ),
                ),
                Padding(
                  padding: EdgeInsets.fromLTRB(16 * escalaCard, 12 * escalaCard, 16 * escalaCard, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TextoAcessivel(
                        texto: widget.escola.nome,
                        textoOcultoParaLer: '${_expandirSiglasParaAudio(widget.escola.nome)}. Fica em ${widget.escola.cidade}, a ${_formatarDistancia(widget.escola.distanciaMetros)} do seu local atual. Turnos disponíveis: ${turnos.join(", ")}. Benefícios: ${beneficios.take(4).join(", ")}. Toque no botão azul abaixo para iniciar a pré-inscrição.',
                        estilo: GoogleFonts.inter(fontSize: 18 * escalaCard, fontWeight: FontWeight.w800, color: Paleta.textoPrincipal, height: 1.1),
                      ),
                      SizedBox(height: 6 * escalaCard),
                      Text(
                        widget.minhaLocalizacao != null ? '${widget.escola.cidade} • ${_formatarDistancia(widget.escola.distanciaMetros)} do seu local atual.' : '${widget.escola.cidade} • Calculando...',
                        style: GoogleFonts.inter(fontSize: 13 * escalaCard, color: Paleta.textoSecundario, fontWeight: FontWeight.w500),
                      ),
                      SizedBox(height: 12 * escalaCard),
                      TextoAcessivel(texto: 'Turnos disponíveis:', ocultarIcone: true, estilo: GoogleFonts.inter(fontSize: 11 * escalaCard, fontWeight: FontWeight.bold, color: Paleta.textoSecundario)),
                      SizedBox(height: 6 * escalaCard),
                      Wrap(
                        spacing: 8 * escalaCard, runSpacing: 8 * escalaCard,
                        children: turnos.map((t) => _buildTagChip(texto: t, corFundo: Paleta.azulIcones.withValues(alpha: 0.1), corTexto: Paleta.azulPrincipal, icone: Icons.schedule_rounded, corIcone: Paleta.azulPrincipal, escala: escalaCard)).toList(),
                      ),
                      SizedBox(height: 12 * escalaCard),
                      if (beneficios.isNotEmpty) ...[
                        TextoAcessivel(texto: 'Benefícios oferecidos:', ocultarIcone: true, estilo: GoogleFonts.inter(fontSize: 11 * escalaCard, fontWeight: FontWeight.bold, color: Paleta.textoSecundario)),
                        SizedBox(height: 6 * escalaCard),
                        Wrap(
                          spacing: 6 * escalaCard, runSpacing: 6 * escalaCard,
                          children: beneficios.take(4).map((b) => _buildTagChip(texto: b, corFundo: Paleta.fundoVerde, corTexto: Paleta.verdeSucesso, icone: Icons.check_circle_outline_rounded, corIcone: Paleta.verdeSucesso, escala: escalaCard)).toList(),
                        ),
                        SizedBox(height: 8 * escalaCard),
                      ],
                    ],
                  ),
                ),
                Padding(
                  padding: EdgeInsets.fromLTRB(16 * escalaCard, 4 * escalaCard, 16 * escalaCard, 12 * escalaCard),
                  child: Column(
                    children: [
                      SizedBox(
                        width: double.infinity, height: 42 * escalaCard,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(backgroundColor: Paleta.azulBotao, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12 * escalaCard)), elevation: 0),
                          onPressed: () {
                            pararVoz();
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => TelaDetalhes(
                                  idEscola: widget.escola.id, nomeEscola: widget.escola.nome, bairro: widget.escola.bairro, cidade: widget.escola.cidade, nivel: widget.nivelEscolhido, turnos: widget.escola.turnos, distancia: _formatarDistancia(widget.escola.distanciaMetros),
                                ),
                              ),
                            ).then((_) => falarAoVoltar("Detalhes da escola fechados. Voltamos para a lista de escolas."));
                          },
                          child: TextoAcessivel(texto: 'Ver Escola', ocultarIcone: true, corIcone: Colors.white, estilo: TextStyle(fontSize: 16 * escalaCard, fontWeight: FontWeight.bold, color: Colors.white)),
                        ),
                      ),
                      SizedBox(height: 8 * escalaCard),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.favorite_border_rounded, size: 14 * escalaCard, color: Paleta.textoSecundario),
                          SizedBox(width: 6 * escalaCard),
                          Text('Inscrição gratuita • sem burocracia', style: GoogleFonts.inter(fontSize: 12 * escalaCard, fontWeight: FontWeight.w500, color: Paleta.textoSecundario)),
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