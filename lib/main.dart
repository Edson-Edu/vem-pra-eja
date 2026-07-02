import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart'; // Import necessário para o DevicePreview
import 'package:supabase_flutter/supabase_flutter.dart'; 
import 'package:device_preview/device_preview.dart'; // IMPORT DO DEVICE PREVIEW
import 'telas/tela_abertura.dart';
import 'package:google_fonts/google_fonts.dart';

Future<void> main() async {
  // Garante que o Flutter foi inicializado antes de chamar o Supabase
  WidgetsFlutterBinding.ensureInitialized();
  
  // INICIALIZAÇÃO DO SUPABASE 
  await Supabase.initialize(
    url: 'https://uoeguwnhqalhnzolhism.supabase.co',
    anonKey: 'sb_publishable_LjkQhUE_XAiq9EHMDCM4PQ_c9vT_TZU',
  );

  // MÁGICA ACONTECE AQUI: Envolvemos o app no DevicePreview
  runApp(
    DevicePreview(
      enabled: !kReleaseMode, // Só liga quando estiver testando, desliga na versão final
      builder: (context) => const EjaConectaApp(),
    ),
  );
}

class EjaConectaApp extends StatelessWidget {
  const EjaConectaApp({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Vem Pra Eja',
      
      // CONFIGURAÇÕES DO DEVICE PREVIEW PARA A TELA
      locale: DevicePreview.locale(context),
      builder: DevicePreview.appBuilder,
      
      theme: ThemeData(
        useMaterial3: true,
        // FONTE INTER DEFINIDA COMO PADRÃO
        textTheme: GoogleFonts.interTextTheme(
          Theme.of(context).textTheme,
        ),
        
        scaffoldBackgroundColor: const Color(
          0xFFFAFAFA, 
        ), 
        
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(
            0xFF3F51B5,
          ), 
          primary: const Color(
            0xFF3F51B5,
          ), 
          secondary: const Color(
            0xFFFF9800, 
          ),
        ),
      ),
      home: const TelaAbertura(), 
    );
  }
}