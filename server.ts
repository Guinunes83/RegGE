import express from "express";
import { createServer as createViteServer } from "vite";
import puppeteer from "puppeteer";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware para JSON
  app.use(express.json());

  // Rota de API para o RPA da Plataforma Brasil
  app.post("/api/scrape-pb", async (req, res) => {
    const { caaes } = req.body; // array de CAAEs para pesquisar

    // Validação básica
    if (!caaes || !Array.isArray(caaes)) {
      return res.status(400).json({ error: "Lista de CAAEs não fornecida." });
    }

    try {
      console.log("Iniciando RPA para Plataforma Brasil...");
      
      // Essa flag '--no-sandbox' é necessária em muitos ambientes,
      // mas se estiver executando no AI Studio (container), o Chromium não tem as bibliotecas de SO necessárias e falhará.
      const browser = await puppeteer.launch({
        headless: true, // Quando rodar na sua máquina, você pode colocar `false` para ver "a mágica acontecer"
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();

      // Navegar para o Login
      console.log("Acessando a Plataforma Brasil...");
      await page.goto('https://plataformabrasil.saude.gov.br/login.jsf', { waitUntil: 'networkidle2' });

      // Clicar em "Fechar" no modal/janela flutuante caso ele abra
      try {
        await page.waitForSelector('button[title="Fechar"]', { timeout: 3000 });
        await page.click('button[title="Fechar"]');
        console.log("Aviso fechado.");
      } catch (e) {
        console.log("Nenhum aviso flutuante encontrado, seguindo em frente.");
      }

      // Preencher credenciais
      console.log("Efetuando Login...");
      await page.waitForSelector('input[name="j_username"]', { timeout: 5000 });
      // ATENÇÃO: As credenciais estão hardcoded aqui, mas você pode usar process.env.PB_EMAIL e process.env.PB_PASSWORD
      await page.type('input[name="j_username"]', 'guilherme.nunes@grupoelora.org.br');
      await page.type('input[name="j_password"]', '251208');
      
      // Clicar no botão de Login
      // A submissão normalmente acontece no formulário
      await page.click('button:has-text("Entrar")'); // Ou buscar pelo ID correspondente
      // Na PB, o botão mudar de estrutura as vezes. Vamos simular pressionar o Enter no campo de senha para garantir
      await page.keyboard.press('Enter');
      
      console.log("Aguardando carregamento da Homepage...");
      // Esperar a Homepage (exemplo genérico de algum link restrito na homepage, altere de acordo com a estrutura do site)
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      const results = [];

      for (const caae of caaes) {
        console.log(`Buscando Estudo com CAAE: ${caae}...`);
        
        // 1. Inserir o CAAE no campo de pesquisa
        // obs: Ajuste o selector abaixo para refletir o ID correto do campo CAAE na PB
        const searchInputSelector = 'input[title="CAAE/Projeto"]'; // Este é um seletor hipotético
        try {
            await page.waitForSelector(searchInputSelector, { timeout: 5000 });
            
            // Limpa o input antes
            await page.click(searchInputSelector, { clickCount: 3 });
            await page.keyboard.press('Backspace');
            
            await page.type(searchInputSelector, caae);

            // Clicar no botão de busca
            const searchButtonSelector = 'button:has-text("Buscar Projeto de Pesquisa")';
            await page.click(searchButtonSelector);

            // Aguardar a tabela ser atualizada
            // A PB geralmente usa requisições AJAX e desabilita blocos, usar "networkidle0" é mais seguro ou waitForSelector da tabela
            await new Promise(r => setTimeout(r, 4000)); // Esperar o ajax de busca completar, você pode melhorar isso com waitForSelector

            // Ler a "Situação" da tabela de resultados
            // Ajustar o seletor da coluna Situação de acordo com o código HTML atualizado do site
            const situationSelector = 'table#tabelaResultadoBusca tbody tr td:nth-child(5)'; // Exemplo
            
            await page.waitForSelector(situationSelector, { timeout: 5000 });
            const situationText = await page.$eval(situationSelector, el => el.textContent?.trim());
            
            results.push({ caae, status: situationText });
            console.log(`Resultado CAAE ${caae}: ${situationText}`);
        } catch (e) {
            console.log(`Erro ao buscar o CAAE ${caae}: `, e);
            results.push({ caae, status: "Erro ao buscar (CAAE não encontrado ou timeout)" });
        }
      }

      await browser.close();
      return res.json({ success: true, results });

    } catch (error) {
      console.error("Erro no fluxo do RPA Puppeteer:", error);
      res.status(500).json({ 
          error: "Falha na execução do RPA", 
          details: error.message,
          suggestion: "Se você estiver rodando isso em nuvem, pode faltar instalações do Chromium. Exporte o app e rode localmente usando 'npm run dev'."
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
