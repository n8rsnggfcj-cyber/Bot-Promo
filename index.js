const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const PORTA = process.env.PORT || 3000;

// 🔧 SUAS CONFIGURAÇÕES — preencha depois!
const CONFIG = {
  shopeeAffiliateId: 'SEU_ID_AQUI',
  mercadoLivreAffiliateId: 'SEU_ID_AQUI',
  whatsappApiUrl: 'URL_DO_WHATSAPP',
  webhookSecret: 'CHAVE_SECRETA'
};

// 📦 Lista de produtos para monitorar
const produtos = [
  { nome: "Fone Bluetooth", precoMax: 50, loja: "ambos" },
  { nome: "Celular Android", precoMax: 1500, loja: "shopee" },
  { nome: "Notebook", precoMax: 3000, loja: "mercadolivre" }
];

// ✅ Buscar promoções Shopee
async function buscarShopee(produto) {
  try {
    const resposta = await axios.get(`https://api.shopee.com.br/search?q=${produto.nome}`);
    // ⚠️ Aqui você adapta conforme a API real
    return [{
      titulo: produto.nome + " - OFERTA",
      preco: 49.90,
      link: `https://shopee.com.br/search?keyword=${produto.nome}&affiliate_id=${CONFIG.shopeeAffiliateId}`,
      loja: "Shopee"
    }];
  } catch (erro) {
    console.log("Erro Shopee:", erro.message);
    return [];
  }
}

// ✅ Buscar promoções Mercado Livre
async function buscarMercadoLivre(produto) {
  try {
    return [{
      titulo: produto.nome + " - SUPER OFERTA",
      preco: 89.90,
      link: `https://mercadolivre.com.br/produtos/${produto.nome}?affiliate_id=${CONFIG.mercadoLivreAffiliateId}`,
      loja: "Mercado Livre"
    }];
  } catch (erro) {
    return [];
  }
}

// 🤖 Enviar mensagem no WhatsApp
async function enviarWhatsApp(mensagem) {
  console.log("📤 Enviando mensagem:\n", mensagem);
  // await axios.post(CONFIG.whatsappApiUrl, { texto: mensagem });
}

// 🔍 Verificar promoções e disparar
async function verificarPromocoes() {
  console.log("🔍 Buscando promoções...");
  let todasPromocoes = [];

  for (const prod of produtos) {
    if (prod.loja === "ambos" || prod.loja === "shopee") {
      todasPromocoes.push(...await buscarShopee(prod));
    }
    if (prod.loja === "ambos" || prod.loja === "mercadolivre") {
      todasPromocoes.push(...await buscarMercadoLivre(prod));
    }
  }

  if (todasPromocoes.length > 0) {
    let mensagem = "🌟 *PROMOÇÕES ENCONTRADAS - PROMO ESTRELA* 🌟\n\n";
    todasPromocoes.forEach(p => {
      mensagem += `✅ ${p.titulo}\n💰 R$ ${p.preco}\n🛒 ${p.loja}\n🔗 ${p.link}\n\n`;
    });
    await enviarWhatsApp(mensagem);
  }
}

// 📡 Webhook (recebe comandos externos)
app.post('/webhook', (req, res) => {
  const { acao } = req.body;
  if (acao === 'buscar-agora') verificarPromocoes();
  res.json({ status: "ok", mensagem: "Busca iniciada!" });
});

// ✅ Página inicial
app.get('/', (req, res) => {
  res.send("🤖 Promo Estrela está ONLINE!");
});

// ⏰ Verificação automática a cada 60 minutos
setInterval(verificarPromocoes, 60 * 60 * 1000);

app.listen(PORTA, () => {
  console.log(`✅ Servidor rodando na porta ${PORTA}`);
  verificarPromocoes();
});
