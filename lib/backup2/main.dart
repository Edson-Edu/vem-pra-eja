import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart'; // IMPORT DO SUPABASE
import 'telas/tela_abertura.dart';
import 'package:google_fonts/google_fonts.dart';

Future<void> main() async {
  // Garante que o Flutter foi inicializado antes de chamar o Supabase
  WidgetsFlutterBinding.ensureInitialized();
  
  // INICIALIZAÇÃO DO SUPABASE (Substitua pelas suas chaves reais!)
  await Supabase.initialize(
    url: 'https://uoeguwnhqalhnzolhism.supabase.co',
    anonKey: 'sb_publishable_LjkQhUE_XAiq9EHMDCM4PQ_c9vT_TZU',
  );

  runApp(const EjaConectaApp());
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