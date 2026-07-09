import 'package:flutter/material.dart';

class Paleta {
  // ==========================================
  // CORES OFICIAIS DA PREFEITURA
  // ==========================================
  
  /// Azul escuro (0257A0) - Ideal para AppBar, fundo da tela de abertura e detalhes.
  static const Color azulPrincipal = Color(0xFF0257A0); 
  
  /// Cinza super claro (F2F3F6) - Ideal para o fundo de todas as telas de navegação.
  static const Color fundoGeral = Color(0xFFF2F3F6);    
  
  /// Azul intermediário (4E8AFB) - Ideal para ícones e badges.
  static const Color azulIcones = Color(0xFF4E8AFB);    
  
  /// Azul vibrante (008BFF) - Ideal para o Botão Principal e Destaques que pedem clique.
  static const Color azulBotao = Color(0xFF008BFF);     
  
  /// Branco puro (FFFFFF) - Ideal para o fundo dos Cards (onde ficam os inputs) e textos no fundo azul escuro.
  static const Color cardBranco = Color(0xFFFFFFFF);        

  // ==========================================
  // CORES DE SUPORTE (Para os Textos e Validações)
  // ==========================================
  
static const Color textoDestaque = Color(0xFF0257A0);

/// Verde para tags de benefícios (Auxílios, alimentação, etc)
  static const Color verdeSucesso = Color(0xFF16A34A); 
  static const Color fundoVerde = Color(0xFFDCFCE7);

  /// Azul bem escuro/quase preto - Para títulos e textos principais lerem bem no fundo claro.
  static const Color textoPrincipal = Color(0xFF1E293B); 
  
  /// Cinza azulado - Para legendas e textos menores (como "Opcional").
  static const Color textoSecundario = Color(0xFF64748B); 
  
  /// Laranja/Vermelho - Para os alertas e erros do formulário.
  static const Color erro = Color(0xFFF97316);        


  // ==========================================
  // CORES ESPECÍFICAS DA TELA DE CADASTRO
  // ==========================================
  
  /// Fundo da tela de cadastro
  static const Color fundoCadastro = Color(0xFFF2F3F6); // Cinza super claro

  /// Textos de título ("Nome da Escola", "DADOS DE CONTATO")
  static const Color textoTituloCadastro = Color(0xFF1E293B); // Azul muito escuro

  /// Subtítulo "Você está se inscrevendo na escola..."
  static const Color textoSubtituloCadastro = Color(0xFF4E8AFB); // Azul médio

  /// Ícones principais do formulário e botões secundários
  static const Color iconeAcaoCadastro = Color(0xFF0257A0); // Azul oficial da prefeitura

  /// Cor da sombra ao redor dos cartões brancos
  static const Color sombraFormularioCadastro = Color(0xFF0257A0); 

  /// Fundo e texto da Tag que mostra o Nível selecionado
  static const Color fundoTagNivelCadastro = Color(0xFFE6F0FA); // Azul bem clarinho
  static const Color textoTagNivelCadastro = Color(0xFF0257A0);

  /// Fundo e texto da Tag que mostra o Turno selecionado
  static const Color fundoTagTurnoCadastro = Color(0xFFD6E8FA); 
  static const Color textoTagTurnoCadastro = Color(0xFF0257A0);

  /// Cor principal do botão gigante de "Realizar Pré-Inscrição"
  static const Color botaoPrincipalCadastro = Color(0xFF008BFF); // Azul vibrante


  // ==========================================
  // CORES ESPECÍFICAS DA TELA DE SUCESSO
  // ==========================================
  
  /// Cor principal de sucesso (Verde) para a bolinha do Check
  static const Color corCheckSucesso = Color.fromARGB(255, 7, 170, 67); 
  
  /// Fundo e texto do banner de aviso ("Fique atento...")
  static const Color fundoAvisoSucesso = Color(0xFFE6F0FA); // Azul clarinho
  static const Color textoAvisoSucesso = Color(0xFF0257A0); // Azul oficial da prefeitura
  
  /// Cor das bolinhas dos passos numerados (1, 2, 3)
  static const Color bolinhaPassoSucesso = Color(0xFF008BFF); // Azul vibrante

}                                      
