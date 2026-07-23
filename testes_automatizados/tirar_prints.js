const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  // ============================================================================
  // O CARDÁPIO DE APARELHOS (Adicione ou remova o que quiser!)
  // ============================================================================
  const listaAparelhos = [
    // CELULARES IPHONE
    { categoria: 'celulares', marca: 'iphone', modelo: 'iPhone_14_Pro', config: devices['iPhone 14 Pro'] },
    { categoria: 'celulares', marca: 'iphone', modelo: 'iPhone_13', config: devices['iPhone 13'] },
    
    // CELULARES ANDROID
    { categoria: 'celulares', marca: 'samsung', modelo: 'Galaxy_S22', config: devices['Galaxy S22'] },
    { categoria: 'celulares', marca: 'google', modelo: 'Pixel_7', config: devices['Pixel 7'] },
    
    // TABLETS
    { categoria: 'tablets', marca: 'ipad', modelo: 'iPad_Pro_11', config: devices['iPad Pro 11'] },
    { categoria: 'tablets', marca: 'samsung', modelo: 'Galaxy_Tab_S4', config: devices['Galaxy Tab S4'] },
    
    // COMPUTADORES (Definimos a resolução na mão)
    { categoria: 'computadores', marca: 'notebook', modelo: 'MacBook_13', config: { viewport: { width: 1280, height: 800 } } },
    { categoria: 'computadores', marca: 'desktop', modelo: 'Monitor_FullHD', config: { viewport: { width: 1920, height: 1080 } } }
  ];

  console.log('🤖 Iniciando o Robô Multi-Telas (Modo Invisível Ativado)...');
  
  // HEADLESS: TRUE -> Roda invisível e super rápido!
  const browser = await chromium.launch({ headless: false, slowMo: 150 });

  // Loop que passa por cada aparelho da lista
  for (const aparelho of listaAparelhos) {
    console.log(`\n========================================================`);
    console.log(`📱 Testando: ${aparelho.modelo} (${aparelho.marca})`);
    console.log(`========================================================`);

    // Cria a pasta dinamicamente (ex: prints_completos/celulares/samsung/Galaxy_S22)
    const caminhoPasta = `./prints_completos/${aparelho.categoria}/${aparelho.marca}/${aparelho.modelo}`;
    fs.mkdirSync(caminhoPasta, { recursive: true });

    const context = await browser.newContext({
      ...aparelho.config,
      geolocation: { latitude: -26.9922, longitude: -48.6340 },
      permissions: ['geolocation'],
      colorScheme: 'light',
    });

    const page = await context.newPage();

    // ============================================================================
    // FUNÇÕES DE AJUDA DINÂMICAS
    // ============================================================================
    async function ativarAcessibilidade() {
      try {
        const placeholder = page.locator('flt-semantics-placeholder').first();
        await placeholder.waitFor({ state: 'attached', timeout: 8000 });
        await placeholder.dispatchEvent('click');
      } catch {
        await page.keyboard.press('Tab');
        await page.keyboard.press('Enter');
      }
      await page.waitForTimeout(1500);
    }

    // SCROLL INTELIGENTE: Arrasta baseado na porcentagem da tela (Funciona em qualquer aparelho)
    async function arrastarTela() {
      const tamanhoTela = page.viewportSize();
      const meioX = tamanhoTela.width / 2;
      const inicioY = tamanhoTela.height * 0.8; // Começa o dedo lá embaixo (80% da tela)
      const fimY = tamanhoTela.height * 0.2;    // Puxa até lá em cima (20% da tela)

      await page.mouse.move(meioX, inicioY);
      await page.mouse.down(); 
      await page.waitForTimeout(300); 
      await page.mouse.move(meioX, fimY, { steps: 30 }); 
      await page.waitForTimeout(200);
      await page.mouse.up(); 
      await page.waitForTimeout(1500); 
    }

    // ============================================================================
    // 1. ABERTURA
    // ============================================================================
    console.log('   📸 1. Abertura...');
    await page.goto('https://vem-pra-eja--teste-acessibilidade-ece625r4.web.app');
    await ativarAcessibilidade();

    await page.getByText('carregando').first().waitFor({ timeout: 15000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${caminhoPasta}/01_abertura.png` });
    await page.waitForTimeout(3000); 

    // ============================================================================
    // 2. NÍVEIS
    // ============================================================================
    console.log('   📸 2. Níveis...');
    await page.getByText('Até que série').first().waitFor({ timeout: 15000 });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: `${caminhoPasta}/02A_niveis_topo.png` });
    await arrastarTela(); // Puxa a tela para baixo!
    await page.screenshot({ path: `${caminhoPasta}/02B_niveis_fundo.png` });
    
    await page.getByText('Nunca estudei').first().dispatchEvent('click');

    // ============================================================================
    // 3. HOME / MAPA
    // ============================================================================
    console.log('   📸 3. Home e Mapa...');
    await page.getByText('Escolha sua escola').first().waitFor({ timeout: 15000 });
    await page.waitForTimeout(4000); 
    
    await page.screenshot({ path: `${caminhoPasta}/03A_home_mapa.png` });
    await arrastarTela(); // Puxa a gaveta do mapa
    await page.screenshot({ path: `${caminhoPasta}/03B_home_lista_aberta.png` });

    await page.getByText('Ver Escola').first().dispatchEvent('click');

    // ============================================================================
    // 4. DETALHES DA ESCOLA
    // ============================================================================
    console.log('   📸 4. Detalhes da Escola...');
    await page.getByText('Selecione um turno').first().waitFor({ timeout: 10000 });
    await page.waitForTimeout(1500);
    
    await page.screenshot({ path: `${caminhoPasta}/04A_detalhes_padrao.png` });

    await page.getByText('Noite').first().dispatchEvent('click');
    await page.waitForTimeout(800); 

    await arrastarTela(); // Desce para os benefícios
    await page.screenshot({ path: `${caminhoPasta}/04B_detalhes_turno_selecionado.png` });

    await page.getByText('Quero me inscrever').first().dispatchEvent('click');

    // ============================================================================
    // 5. CADASTRO
    // ============================================================================
    console.log('   📸 5. Formulário de Cadastro...');
    await page.getByLabel('Nome Completo').first().waitFor({ timeout: 10000 });
    await page.waitForTimeout(1000);

    // Contato
    await page.getByLabel('Nome Completo').first().click({ force: true });
    await page.waitForTimeout(100);
    await page.keyboard.type('Edson Eduardo Welter', { delay: 50 });
    
    await page.getByLabel('CPF (Obrigatório)').first().click({ force: true });
    await page.waitForTimeout(100);
    await page.keyboard.type('13095814950', { delay: 50 });
    
    await page.getByLabel('Idade').first().click({ force: true });
    await page.waitForTimeout(100);
    await page.keyboard.type('25', { delay: 50 });
    
    await page.getByLabel('DDD').first().click({ force: true });
    await page.waitForTimeout(100);
    await page.keyboard.type('47', { delay: 50 });
    
    await page.getByLabel('Telefone (WhatsApp)').first().click({ force: true });
    await page.waitForTimeout(100);
    await page.keyboard.type('999998888', { delay: 50 });

    await page.waitForTimeout(1000); 
    await page.screenshot({ path: `${caminhoPasta}/05A_cadastro_contato.png` });

    await page.getByText('Continuar para Endereço').first().dispatchEvent('click');
    await page.waitForTimeout(1500); 

    // Endereço
    await page.getByLabel('Buscar CEP').first().click({ force: true });
    await page.waitForTimeout(100);
    await page.keyboard.type('88330000', { delay: 50 });
    
    await page.keyboard.press('Tab'); 
    await page.waitForTimeout(1500); 
    
    await page.getByLabel('Nº').first().click({ force: true });
    await page.waitForTimeout(100);
    await page.keyboard.type('123', { delay: 50 });
    
    await page.waitForTimeout(1000); 
    await page.screenshot({ path: `${caminhoPasta}/05B_cadastro_endereco.png` });

    // ============================================================================
    // 6. SUCESSO
    // ============================================================================
    console.log('   📸 6. Tela de Sucesso...');
    await page.getByText('PULAR').first().dispatchEvent('click');
    await page.getByText('Inscrição Realizada').first().waitFor({ timeout: 10000 });
    
    await page.waitForTimeout(5000); // Poeira dos confetes baixar
    
    await page.screenshot({ path: `${caminhoPasta}/06_sucesso_limpo.png` });

    // Fecha o contexto desse aparelho para começar o próximo limpinho!
    await context.close();
    console.log(`✅ ${aparelho.modelo} finalizado!`);
  }

  await browser.close();
  console.log('\n🚀 CATÁLOGO DE PRINTS 100% GERADO! Vá olhar a pasta prints_completos!');
})();